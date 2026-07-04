import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secretKey = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const key = new TextEncoder().encode(secretKey);

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Si es login, dejar pasar sin verificación
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Si es /admin, verificar autenticación
  if (pathname.startsWith("/admin")) {
    const session = request.cookies.get("session")?.value;

    if (!session) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    try {
      await jwtVerify(session, key);
      return NextResponse.next();
    } catch (err) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
