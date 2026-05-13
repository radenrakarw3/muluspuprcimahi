/**
 * Edge-safe middleware: pakai authConfig tanpa providers/bcrypt.
 */
import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth: middlewareAuth } = NextAuth(authConfig);

export default middlewareAuth((req) => {
  const { nextUrl } = req;
  const isAdmin = nextUrl.pathname.startsWith("/admin");
  const isLogin = nextUrl.pathname === "/admin/login";

  if (isAdmin && !isLogin && !req.auth) {
    const url = nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (isLogin && req.auth) {
    const url = nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
