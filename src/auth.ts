import { randomUUID } from "crypto";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

const ALLOWED_DOMAIN = "jiu.ac";

// Super-admin (ROOT) accounts — the only accounts that may grant/revoke the module
// admin roles. Kept in code (not the DB) so root can never be revoked by accident.
const ROOT_EMAILS = ["rahma23@jiu.ac"];

// Google only appears once real OAuth credentials are provided, so the app still runs
// (with credentials login) before you fill in the keys from Google Cloud Console.
export const isGoogleConfigured = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
);

// Secure cookies (https) in production; plain cookies over http in dev so the OAuth
// state/session cookies are NOT dropped when a phone hits the app over http.
const useSecureCookies = process.env.NODE_ENV === "production";
const cookiePrefix = useSecureCookies ? "__Secure-" : "";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // Trust the incoming Host/X-Forwarded headers so the OAuth callback URL is computed
  // from the SAME origin the device used (fixes mobile host/callback mismatches).
  trustHost: true,
  session: { strategy: "jwt" },
  // Explicit, environment-aware cookies. SameSite=Lax survives the top-level OAuth
  // redirect on every browser; Secure/prefixes only apply on https so mobile-over-http
  // still works, and a __Host- CSRF prefix is only used when Secure is valid.
  cookies: {
    sessionToken: {
      name: `${cookiePrefix}authjs.session-token`,
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: useSecureCookies },
    },
    callbackUrl: {
      name: `${cookiePrefix}authjs.callback-url`,
      options: { sameSite: "lax", path: "/", secure: useSecureCookies },
    },
    csrfToken: {
      name: `${useSecureCookies ? "__Host-" : ""}authjs.csrf-token`,
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: useSecureCookies },
    },
    pkceCodeVerifier: {
      name: `${cookiePrefix}authjs.pkce.code_verifier`,
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: useSecureCookies, maxAge: 900 },
    },
    state: {
      name: `${cookiePrefix}authjs.state`,
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: useSecureCookies, maxAge: 900 },
    },
    nonce: {
      name: `${cookiePrefix}authjs.nonce`,
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: useSecureCookies },
    },
  },
  providers: [
    ...(isGoogleConfigured
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            // Restrict the Google account chooser to the campus workspace (defense in depth).
            authorization: {
              params: { hd: ALLOWED_DOMAIN, prompt: "select_account" },
            },
          }),
        ]
      : []),
    // Credentials stands in for SSO before OAuth keys exist (and for admin accounts
    // without campus Google identities). Validated against the seeded roster.
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (creds) => {
        const email = String(creds?.email ?? "").toLowerCase().trim();
        const password = String(creds?.password ?? "");
        if (!email || !password) return null;
        const m = await prisma.member.findUnique({ where: { email } });
        if (!m || m.status !== "ACTIVE") return null;
        if (!(await verifyPassword(password, m.passwordHash))) return null;
        return { id: m.id, email: m.email, name: m.fullName };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    // STRICT campus-domain gate for Google SSO.
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        const p = profile as
          | { email?: string; email_verified?: boolean; name?: string }
          | undefined;
        const email = (p?.email ?? "").toLowerCase();

        // 1) The email must be provider-verified and end with @jiu.ac.
        if (p?.email_verified === false) {
          console.warn(`[auth] denied: Google email not verified — ${email}`);
          return false;
        }
        if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
          console.warn(
            `[auth] denied: non-campus Google account — "${email}" (expected @${ALLOWED_DOMAIN}). ` +
              `Likely a personal Gmail chosen on the device instead of the campus account.`,
          );
          return false;
        }

        // 2) Resolve the member. Existing members must be ACTIVE. A DB failure here
        //    (e.g. a Neon cold-start timeout) must NOT be reported as "wrong email":
        //    log it and rethrow so it surfaces as a distinct, retryable server error.
        let existing;
        try {
          existing = await prisma.member.findUnique({ where: { email } });
        } catch (err) {
          console.error(
            `[auth] database unreachable during sign-in for ${email} — retryable (Neon cold start?)`,
            err,
          );
          throw err;
        }
        if (existing) {
          if (existing.status !== "ACTIVE") {
            console.warn(`[auth] denied: ${email} is ${existing.status}, not ACTIVE`);
            return false;
          }
          // Self-heal: the designated root account always keeps the ROOT role, even
          // if it was first provisioned (or seeded) as a plain student.
          if (ROOT_EMAILS.includes(email)) {
            const hasRoot = await prisma.roleAssignment.findFirst({
              where: { memberId: existing.id, role: "ROOT" },
            });
            if (!hasRoot) {
              await prisma.roleAssignment.create({
                data: { memberId: existing.id, role: "ROOT" },
              });
              console.info(`[auth] ensured ROOT role for ${email}`);
            }
          }
          return true;
        }

        // 3) First campus login → auto-provision. Root emails get ROOT; everyone else
        //    a least-privilege STUDENT. (Stands in for the SIS/directory sync: with a
        //    real directory you would resolve NIM + enrollment and reject non-roster.)
        const isRoot = ROOT_EMAILS.includes(email);
        try {
          await prisma.member.create({
            data: {
              memberType: "STUDENT",
              fullName: p?.name ?? email.split("@")[0],
              campusId: email.split("@")[0],
              email,
              status: "ACTIVE",
              dormId: "DORM-A",
              passwordHash: await hashPassword(randomUUID()), // unusable — SSO only
              roleAssignments: { create: [{ role: isRoot ? "ROOT" : "STUDENT" }] },
            },
          });
          console.info(
            `[auth] provisioned new campus member — ${email}${isRoot ? " (ROOT)" : ""}`,
          );
        } catch {
          // Concurrent first-login race — the unique(email) constraint means the other
          // request already created it. Idempotent: fall through and allow sign-in.
        }
        return true;
      }
      // Credentials were already validated in `authorize`.
      return true;
    },
  },
});
