// Mapa SLUG_ANTIGUO -> SLUG_NUEVO. La fuente es el JSON (también lo usa next.config.js
// para emitir redirecciones 308 reales en el enrutador).
import redirects from "./product-slug-redirects.json";

export const PRODUCT_SLUG_REDIRECTS: Record<string, string> = redirects;
