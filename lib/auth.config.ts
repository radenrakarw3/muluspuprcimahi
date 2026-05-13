/**
 * Konfigurasi Auth.js edge-safe (tanpa bcrypt / drizzle).
 * Dipakai oleh middleware (Edge Runtime).
 */
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
  providers: [],
  callbacks: {
    authorized({ auth: a, request }) {
      const path = request.nextUrl.pathname;
      const isAdmin = path.startsWith("/admin");
      const isLogin = path === "/admin/login";
      if (isAdmin && !isLogin) {
        return Boolean(a?.user);
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = (user as { id?: string }).id;
        token.role = (user as { role?: string }).role;
        token.nama = (user as { nama?: string }).nama;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "super_admin" | "verifikator" | "operator";
        session.user.nama = (token.nama as string) ?? session.user.name ?? "";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
