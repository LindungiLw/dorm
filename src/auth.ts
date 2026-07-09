import { randomUUID } from "crypto";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";

// Two campus domains may sign in: @jiu.ac (students) and @k-eduplex.net (staff / lecturer).
const ALLOWED_DOMAINS = ["jiu.ac", "k-eduplex.net"];
const STAFF_DOMAIN = "k-eduplex.net";
function isAllowedEmail(email: string): boolean {
  return ALLOWED_DOMAINS.some((d) => email.endsWith(`@${d}`));
}

// Super-admin (ROOT) accounts — the only accounts that may grant/revoke the module
// admin roles. Kept in code (not the DB) so root can never be revoked by accident.
const ROOT_EMAILS = ["rahma23@jiu.ac"];

// Google only appears once real OAuth credentials are provided. It is the only sign-in
// method, so there is no way in until the keys from the Google Cloud Console are set.
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
            // Two allowed domains, so the account chooser isn't pinned to one `hd`; the
            // sign-in callback enforces the domain allow-list.
            authorization: {
              params: { prompt: "select_account" },
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    ...authConfig.callbacks,
    // STRICT campus-domain gate for Google SSO.
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        const p = profile as
          | { email?: string; email_verified?: boolean; name?: string; picture?: string }
          | undefined;
        const email = (p?.email ?? "").toLowerCase();
        const picture = typeof p?.picture === "string" ? p.picture : null;

        // 1) The email must be provider-verified and on an allowed campus domain.
        if (p?.email_verified === false) {
          console.warn(`[auth] denied: Google email not verified — ${email}`);
          return false;
        }
        if (!isAllowedEmail(email)) {
          console.warn(
            `[auth] denied: non-campus Google account — "${email}" (expected @jiu.ac or ` +
              `@k-eduplex.net). Likely a personal Gmail chosen instead of the campus account.`,
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
          // Keep the avatar synced with the Google account photo — unless the member
          // uploaded their own (a data: URL), which always wins.
          if (
            picture &&
            existing.photoUrl !== picture &&
            (!existing.photoUrl || existing.photoUrl.startsWith("http"))
          ) {
            await prisma.member.update({
              where: { id: existing.id },
              data: { photoUrl: picture },
            });
          }
          // If this member was pre-provisioned by ROOT (name still a placeholder equal
          // to the campusId), adopt their real Google name on first sign-in.
          if (
            p?.name &&
            existing.fullName === existing.campusId &&
            existing.fullName !== p.name
          ) {
            await prisma.member.update({
              where: { id: existing.id },
              data: { fullName: p.name },
            });
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
        // Domain decides the persona: @k-eduplex.net = staff/lecturer (no dorm), everyone
        // else = student. The real ID + exact status are confirmed at onboarding.
        const isStaff = email.endsWith(`@${STAFF_DOMAIN}`);
        try {
          await prisma.member.create({
            data: {
              memberType: isStaff ? "STAFF" : "STUDENT",
              fullName: p?.name ?? email,
              // Placeholder = the (unique) email, so two domains that share a local part
              // never collide on the unique campusId. Replaced by the real ID at onboarding.
              campusId: email,
              email,
              status: "ACTIVE",
              dormId: isStaff ? null : "DORM-A",
              photoUrl: picture,
              passwordHash: await hashPassword(randomUUID()), // unusable — SSO only
              roleAssignments: {
                create: [{ role: isRoot ? "ROOT" : isStaff ? "FACULTY" : "STUDENT" }],
              },
            },
          });
          console.info(
            `[auth] provisioned new campus member — ${email}${isRoot ? " (ROOT)" : ""}`,
          );
        } catch (err) {
          // A concurrent first-login race means the other request already created this
          // email row — idempotent, so allow sign-in. Anything else is a real failure:
          // surface it so the user is never left signed in with no member record.
          const exists = await prisma.member.findUnique({ where: { email } });
          if (!exists) {
            console.error(`[auth] provisioning failed for ${email}`, err);
            throw err;
          }
        }
        return true;
      }
      // Google is the only provider; nothing else reaches here.
      return true;
    },
  },
});
