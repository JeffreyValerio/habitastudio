import { SITE_URL } from "@/lib/site-url";

// Logo para correos. Los clientes de correo no soportan SVG, por eso se usa PNG.
// Archivo a 2x (360px) para pantallas retina; se muestra a 180px de ancho.
// Todas las plantillas actuales tienen encabezado blanco -> variante "color".
const EMAIL_LOGO_BASE_URL = SITE_URL;

export const EMAIL_LOGO_URL = `${EMAIL_LOGO_BASE_URL}/brand/logo-email-color.png`;
export const EMAIL_LOGO_WIDTH = 180;
// Proporcion del archivo original (2000x588)
export const EMAIL_LOGO_HEIGHT = Math.round((EMAIL_LOGO_WIDTH * 588) / 2000);

export function emailLogoImg(): string {
  return `<img src="${EMAIL_LOGO_URL}" alt="Habita Studio" width="${EMAIL_LOGO_WIDTH}" height="${EMAIL_LOGO_HEIGHT}" style="display:block;border:0;margin:0 auto 20px auto;" />`;
}
