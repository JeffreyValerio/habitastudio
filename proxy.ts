import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Agregar header con la ruta actual
  const response = NextResponse.next();
  response.headers.set("x-pathname", pathname);

  // Permitir acceso a la página de login sin verificación
  if (pathname === "/admin/login" || pathname === "/admin/login/") {
    return response;
  }

  // Para todas las rutas de admin (incluyendo /admin exacto), verificar la cookie de sesión
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const session = request.cookies.get("session");

    if (!session) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
  ],
};

