import type { NextAuthConfig } from "next-auth";

// Edge-safe base config (NO database / Node APIs) so it can run in middleware.
// Providers and the DB-touching callbacks are added in `auth.ts`.
export const authConfig = {
  pages: { signIn: "/login", error: "/login" },
  providers: [],
  callbacks: {
    // Coarse route gate used by middleware: `/dashboard/*` requires a session.
    authorized({ auth, request }) {
      const isProtected = request.nextUrl.pathname.startsWith("/dashboard");
      if (isProtected) return Boolean(auth?.user);
      return true;
    },
  },
} satisfies NextAuthConfig;
