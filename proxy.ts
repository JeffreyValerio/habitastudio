import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas públicas sin verificación
  const publicRoutes = ["/admin/login", "/accept-invitation"];
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Para todas las otras rutas de admin, verificar la cookie de sesión
  if (pathname.startsWith("/admin")) {
    const session = request.cookies.get("session");

    if (!session) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/accept-invitation",
  ],
};
