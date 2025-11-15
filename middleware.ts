import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Agregar header con la ruta actual
  const response = NextResponse.next();
  response.headers.set("x-pathname", pathname);

  // Permitir acceso a la página de login sin verificación
  if (pathname === "/admin/login") {
    return response;
  }

  // Para otras rutas de admin, verificar la cookie de sesión
  if (pathname.startsWith("/admin")) {
    const session = request.cookies.get("session");

    if (!session) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};

