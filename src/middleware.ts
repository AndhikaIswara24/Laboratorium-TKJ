import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Role mapping
    if (path.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/siswa", req.url));
    }
    if (path.startsWith("/guru") && token?.role !== "GURU" && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/siswa", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/guru/:path*", "/siswa/:path*"]
};
