import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir acceso a la página de login sin verificación
  if (pathname.startsWith("/admin/login")) {
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
  ],
};

