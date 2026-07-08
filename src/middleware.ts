import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Edge middleware built from the DB-free base config. It runs the `authorized` callback
// (auth-presence gate) and redirects unauthenticated users hitting /dashboard to /login.
// The authoritative authorization decision still repeats server-side at the data layer.
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: ["/dashboard/:path*"],
};
