import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith("/signup");

  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL("/signup", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/notification/:path*",
    "/notifications/:path*",
    "/tasktracker/:path*",
    "/worklogs/:path*",
    "/instructor/:path*",
    "/profile/:path*",

    "/signup",
    "/",
  ],
};
