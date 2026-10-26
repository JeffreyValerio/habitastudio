/**
 * Configuración de Search Console (sitemap) y GA4 (key events, medición mejorada).
 * Por defecto SOLO LEE. Con --apply escribe los cambios.
 * Uso: npx tsx scripts/google-setup.ts [--apply]
 */
import { GoogleAuth } from "google-auth-library";
import { homedir } from "os";
import path from "path";

const KEY_FILE =
  process.env.GOOGLE_SEO_KEY_FILE || path.join(homedir(), ".secrets/habitastudio-sa.json");
const SITE = process.env.GSC_SITE_URL || "sc-domain:habitastudio.online";
const GA4 = process.env.GA4_PROPERTY_ID || "513385766";
const APPLY = process.argv.includes("--apply");
const SITEMAP = "https://www.habitastudio.online/sitemap.xml";

const KEY_EVENTS: { name: string; method: "ONCE_PER_EVENT" | "ONCE_PER_SESSION" }[] = [
  { name: "generate_lead", method: "ONCE_PER_EVENT" },
  { name: "contact_whatsapp", method: "ONCE_PER_SESSION" },
  { name: "contact_phone", method: "ONCE_PER_SESSION" },
  { name: "contact_email", method: "ONCE_PER_SESSION" },
  { name: "quote_request_click", method: "ONCE_PER_SESSION" },
];

const gscAuth = new GoogleAuth({ keyFile: KEY_FILE, scopes: ["https://www.googleapis.com/auth/webmasters"] });
const gaAuth = new GoogleAuth({ keyFile: KEY_FILE, scopes: ["https://www.googleapis.com/auth/analytics.edit"] });

const GSC_403 = "la cuenta necesita permiso Propietario/Completo en Search Console";
const GA_403 = "la cuenta necesita rol Editor en GA4";

type Res = { ok: boolean; status: number; data: any };

async function req(auth: GoogleAuth, method: string, url: string, body?: unknown): Promise<Res> {
  const client = await auth.getClient();
  const { token } = await client.getAccessToken();
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data: any = text;
  try { data = text ? JSON.parse(text) : {}; } catch { /* texto plano */ }
  return { ok: res.ok, status: res.status, data };
}

function fail(label: string, r: Res, hint403: string) {
  const msg = typeof r.data === "string" ? r.data : r.data?.error?.message || JSON.stringify(r.data);
  console.log(`  ! ${label}: HTTP ${r.status}${r.status === 403 ? ` -> ${hint403}` : ""}`);
  console.log(`    ${String(msg).slice(0, 300)}`);
}

async function searchConsole() {
  console.log(`\n=== Search Console (${SITE}) ===`);
  const base = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE)}/sitemaps`;
  const list = await req(gscAuth, "GET", base);
  let present = false;
  if (!list.ok) {
    fail("listar sitemaps", list, GSC_403);
  } else {
    const items: any[] = list.data.sitemap || [];
    console.log(`Sitemaps registrados: ${items.length}`);
    for (const s of items) {
      const contents = (s.contents || []).map((c: any) => `${c.type}: enviados=${c.submitted} indexados=${c.indexed ?? "n/d"}`).join("; ");
      console.log(`  - ${s.path}`);
      console.log(`    lastSubmitted=${s.lastSubmitted ?? "-"} lastDownloaded=${s.lastDownloaded ?? "-"} errors=${s.errors ?? 0} warnings=${s.warnings ?? 0} pending=${s.isPending ?? false}`);
      if (contents) console.log(`    contents: ${contents}`);
      if (s.path === SITEMAP) present = true;
      else {
        try {
          if (new URL(s.path).host !== new URL(SITEMAP).host)
            console.log(`    * Sitemap de OTRO host (${new URL(s.path).host}); no se elimina, solo se reporta.`);
        } catch { /* ignorar */ }
      }
    }
  }
  if (!APPLY) {
    console.log(present ? `(dry-run) ${SITEMAP} ya está registrado; con --apply se reenviará.` : `(dry-run) con --apply se enviaría ${SITEMAP}`);
    return;
  }
  const put = await req(gscAuth, "PUT", `${base}/${encodeURIComponent(SITEMAP)}`);
  if (put.ok) console.log(`APLICADO: sitemap enviado ${SITEMAP}`);
  else fail("enviar sitemap", put, GSC_403);
}

async function analytics() {
  console.log(`\n=== GA4 (properties/${GA4}) ===`);
  const b = "https://analyticsadmin.googleapis.com";
  const ke = await req(gaAuth, "GET", `${b}/v1beta/properties/${GA4}/keyEvents`);
  let existing = new Set<string>();
  let canRead = ke.ok;
  if (!ke.ok) fail("listar key events", ke, GA_403);
  else {
    const items: any[] = ke.data.keyEvents || [];
    existing = new Set(items.map((k) => k.eventName));
    console.log(`Key events existentes (${items.length}): ${items.map((k) => `${k.eventName}[${k.countingMethod}]`).join(", ") || "(ninguno)"}`);
  }
  for (const k of KEY_EVENTS) {
    if (existing.has(k.name)) { console.log(`  = ${k.name}: ya es key event`); continue; }
    if (!canRead && !APPLY) continue;
    if (!APPLY) { console.log(`  + (dry-run) se crearía ${k.name} (${k.method})`); continue; }
    const r = await req(gaAuth, "POST", `${b}/v1beta/properties/${GA4}/keyEvents`, { eventName: k.name, countingMethod: k.method });
    if (r.ok) console.log(`  APLICADO: key event ${k.name} (${k.method})`);
    else fail(`crear ${k.name}`, r, GA_403);
  }

  // Medición mejorada
  const ds = await req(gaAuth, "GET", `${b}/v1beta/properties/${GA4}/dataStreams`);
  if (!ds.ok) { fail("listar data streams", ds, GA_403); return; }
  const streams: any[] = (ds.data.dataStreams || []).filter((s: any) => s.type === "WEB_DATA_STREAM");
  console.log(`Web streams: ${streams.map((s) => `${s.displayName} (${s.webStreamData?.defaultUri ?? "?"})`).join(", ") || "(ninguno)"}`);
  for (const s of streams) {
    const id = String(s.name).split("/").pop();
    const rel = `properties/${GA4}/dataStreams/${id}/enhancedMeasurementSettings`;
    let ver = "v1beta";
    let em = await req(gaAuth, "GET", `${b}/${ver}/${rel}`);
    if (em.status === 404) { ver = "v1alpha"; em = await req(gaAuth, "GET", `${b}/${ver}/${rel}`); }
    if (!em.ok) { fail(`medición mejorada stream ${id}`, em, GA_403); continue; }
    const e = em.data;
    console.log(`  stream ${id} (${ver}): streamEnabled=${e.streamEnabled} pageChangesEnabled=${e.pageChangesEnabled} scrolls=${e.scrollsEnabled} outbound=${e.outboundClicksEnabled} search=${e.siteSearchEnabled} video=${e.videoEngagementEnabled} forms=${e.formInteractionsEnabled} downloads=${e.fileDownloadsEnabled}`);
    if (e.pageChangesEnabled) continue;
    if (!APPLY) { console.log("    (dry-run) pageChangesEnabled=false; con --apply se activaría."); continue; }
    const p = await req(gaAuth, "PATCH", `${b}/${ver}/${rel}?updateMask=pageChangesEnabled`, { pageChangesEnabled: true });
    if (p.ok) console.log(`    APLICADO: pageChangesEnabled=${p.data.pageChangesEnabled}`);
    else fail("activar pageChangesEnabled", p, GA_403);
  }
}

(async () => {
  console.log(APPLY ? "MODO: --apply (escribe cambios)" : "MODO: solo lectura (usa --apply para escribir)");
  try { await searchConsole(); } catch (e: any) { console.log("Error GSC:", e?.message || e); }
  try { await analytics(); } catch (e: any) { console.log("Error GA4:", e?.message || e); }
})();
