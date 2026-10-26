// Origen canonico unico del sitio publico (con www). Cambiar solo via NEXT_PUBLIC_SITE_URL.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.habitastudio.online"
).replace(/\/+$/, "");

export function absoluteUrl(path = ""): string {
  if (!path) return SITE_URL;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Primera oracion del texto, recortada a `max` caracteres (para meta description). */
export function firstSentence(text: string | null | undefined, max = 155): string {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const m = clean.match(/^.+?[.!?](\s|$)/);
  const s = (m ? m[0] : clean).trim();
  return s.length <= max ? s : s.slice(0, max - 1).trimEnd() + "…";
}
