/**
 * Reporte SEO de solo lectura: Google Search Console + GA4.
 * Uso: npx tsx scripts/seo-report.ts [--days 90]
 */
import { GoogleAuth } from "google-auth-library";
import { mkdirSync, writeFileSync } from "fs";
import { homedir } from "os";
import path from "path";

const KEY_FILE =
  process.env.GOOGLE_SEO_KEY_FILE || path.join(homedir(), ".secrets/habitastudio-sa.json");
const SITE = process.env.GSC_SITE_URL || "sc-domain:habitastudio.online";
const GA4 = process.env.GA4_PROPERTY_ID || "513385766";

const argDays = process.argv.indexOf("--days");
const DAYS = argDays > -1 ? Number(process.argv[argDays + 1]) || 90 : 90;

const gscAuth = new GoogleAuth({ keyFile: KEY_FILE, scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
const gaAuth = new GoogleAuth({ keyFile: KEY_FILE, scopes: ["https://www.googleapis.com/auth/analytics.readonly"] });

const iso = (d: Date) => d.toISOString().slice(0, 10);
const daysAgo = (n: number) => { const d = new Date(); d.setUTCDate(d.getUTCDate() - n); return d; };
// GSC tiene ~2 días de retraso
const cur = { start: iso(daysAgo(DAYS + 2)), end: iso(daysAgo(2)) };
const prev = { start: iso(daysAgo(DAYS * 2 + 3)), end: iso(daysAgo(DAYS + 3)) };

type Json = any;
const errors: Record<string, string> = {};

async function call(auth: GoogleAuth, section: string, permHint: string, url: string, body?: unknown): Promise<Json | null> {
  try {
    const client = await auth.getClient();
    const { token } = await client.getAccessToken();
    const res = await fetch(url, {
      method: body ? "POST" : "GET",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    if (!res.ok) {
      const hint = res.status === 403 ? ` (FALTA PERMISO: ${permHint})` : res.status === 404 ? " (recurso no encontrado)" : "";
      errors[section] = `HTTP ${res.status}${hint}: ${text.slice(0, 500)}`;
      console.error(`[${section}] ${errors[section]}`);
      return null;
    }
    return JSON.parse(text);
  } catch (e: any) {
    errors[section] = String(e?.message || e);
    console.error(`[${section}] ${errors[section]}`);
    return null;
  }
}

const gscUrl = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE)}/searchAnalytics/query`;
const GSC_PERM = `el service account debe agregarse como usuario en Search Console de ${SITE} y la API Search Console debe estar habilitada`;
const GA_PERM = `el service account debe tener rol Viewer en GA4 ${GA4} y la API "Google Analytics Data API" debe estar habilitada`;

const gsc = (section: string, range: { start: string; end: string }, dimensions: string[], rowLimit: number) =>
  call(gscAuth, section, GSC_PERM, gscUrl, {
    startDate: range.start, endDate: range.end, dimensions, rowLimit, dataState: "final",
  }).then((r) => (r ? (r.rows ?? []) : null));

const gaUrl = `https://analyticsdata.googleapis.com/v1beta/properties/${GA4}:runReport`;
async function ga(section: string, dims: string[], mets: string[], opts: { limit?: number; filter?: Json; range?: { start: string; end: string }; order?: string } = {}) {
  const r = opts.range ?? cur;
  const body: Json = {
    dateRanges: [{ startDate: r.start, endDate: r.end }],
    dimensions: dims.map((name) => ({ name })),
    metrics: mets.map((name) => ({ name })),
    limit: opts.limit ?? 50,
    orderBys: [{ metric: { metricName: opts.order ?? mets[0] }, desc: true }],
  };
  if (opts.filter) body.dimensionFilter = opts.filter;
  const res = await call(gaAuth, section, GA_PERM, gaUrl, body);
  if (!res) return null;
  return (res.rows ?? []).map((row: Json) => {
    const o: Json = {};
    dims.forEach((d, i) => (o[d] = row.dimensionValues[i].value));
    mets.forEach((m, i) => (o[m] = Number(row.metricValues[i].value)));
    return o;
  });
}
const eqFilter = (field: string, value: string) => ({ filter: { fieldName: field, stringFilter: { matchType: "EXACT", value } } });

async function main() {
  const out: Json = { generatedAt: new Date().toISOString(), site: SITE, ga4Property: GA4, days: DAYS, current: cur, previous: prev, gsc: {}, ga4: {}, errors };

  console.log(`Periodo actual ${cur.start}..${cur.end}, previo ${prev.start}..${prev.end}`);
  const g = out.gsc;
  g.totals = await gsc("gsc.totals", cur, [], 1);
  g.totalsPrev = await gsc("gsc.totalsPrev", prev, [], 1);
  g.queries = await gsc("gsc.queries", cur, ["query"], 200);
  g.pages = await gsc("gsc.pages", cur, ["page"], 100);
  g.queryPage = await gsc("gsc.queryPage", cur, ["query", "page"], 300);
  g.devices = await gsc("gsc.devices", cur, ["device"], 10);
  g.countries = await gsc("gsc.countries", cur, ["country"], 10);
  const sm = await call(gscAuth, "gsc.sitemaps", GSC_PERM, `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE)}/sitemaps`);
  g.sitemaps = sm ? sm.sitemap ?? [] : null;

  const a = out.ga4;
  a.channels = await ga("ga4.channels", ["sessionDefaultChannelGroup"], ["sessions", "totalUsers", "engagedSessions", "engagementRate", "averageSessionDuration"]);
  a.channelsPrev = await ga("ga4.channelsPrev", ["sessionDefaultChannelGroup"], ["sessions", "totalUsers", "engagedSessions"], { range: prev });
  a.landingPages = await ga("ga4.landingPages", ["landingPage"], ["sessions", "engagedSessions", "keyEvents"], { limit: 50 });
  a.organicLandingPages = await ga("ga4.organicLandingPages", ["landingPage"], ["sessions", "engagedSessions", "keyEvents"], { limit: 50, filter: eqFilter("sessionDefaultChannelGroup", "Organic Search") });
  a.events = await ga("ga4.events", ["eventName"], ["eventCount"], {
    limit: 20,
    filter: { filter: { fieldName: "eventName", inListFilter: { values: ["generate_lead", "contact_whatsapp", "contact_phone", "contact_email", "quote_request_click", "view_item", "page_view"] } } },
  });
  a.devices = await ga("ga4.devices", ["deviceCategory"], ["sessions", "totalUsers", "engagedSessions"]);
  a.cities = await ga("ga4.cities", ["city"], ["sessions", "totalUsers"], { limit: 15 });
  a.countries = await ga("ga4.countries", ["country"], ["sessions", "totalUsers"], { limit: 10 });

  mkdirSync("backups/seo", { recursive: true });
  const stamp = iso(new Date());
  writeFileSync(`backups/seo/seo-report-${stamp}.json`, JSON.stringify(out, null, 2));
  writeFileSync(`backups/seo/seo-report-${stamp}.md`, toMarkdown(out));
  console.log(`Guardado en backups/seo/seo-report-${stamp}.{json,md}`);
  console.log("Secciones con error:", Object.keys(errors).length ? Object.keys(errors).join(", ") : "ninguna");
}

const n = (x: number, d = 0) => (typeof x === "number" ? x.toLocaleString("es-CR", { maximumFractionDigits: d }) : "-");
const pct = (x: number) => (typeof x === "number" ? (x * 100).toFixed(1) + "%" : "-");
const esc = (s: string) => String(s).replace(/\|/g, "\\|");
function table(headers: string[], rows: (string | number)[][]) {
  if (!rows.length) return "_Sin datos._\n";
  return [`| ${headers.join(" | ")} |`, `|${headers.map(() => "---").join("|")}|`, ...rows.map((r) => `| ${r.map((c) => esc(String(c))).join(" | ")} |`)].join("\n") + "\n";
}
const section = (title: string, rows: any, render: (r: any[]) => string, key: string) =>
  `\n## ${title}\n\n` + (rows === null ? `**ERROR:** ${errors[key] ?? "desconocido"}\n` : render(rows));

function toMarkdown(o: Json): string {
  const g = o.gsc, a = o.ga4;
  const t = g.totals?.[0], tp = g.totalsPrev?.[0];
  const gscRows = (rows: Json[], dimLabel: string) =>
    table([dimLabel, "Clics", "Impresiones", "CTR", "Posición"], rows.map((r) => [r.keys.join(" → "), n(r.clicks), n(r.impressions), pct(r.ctr), n(r.position, 1)]));
  let md = `# Reporte SEO habitastudio.online\n\nGenerado: ${o.generatedAt}\nPeriodo actual: ${o.current.start} a ${o.current.end} (${o.days} días). Previo: ${o.previous.start} a ${o.previous.end}.\n`;
  md += section("Search Console: totales", g.totals, () =>
    table(["Periodo", "Clics", "Impresiones", "CTR", "Posición prom."], [
      ["Actual", n(t?.clicks ?? 0), n(t?.impressions ?? 0), pct(t?.ctr ?? 0), n(t?.position ?? 0, 1)],
      ["Previo", n(tp?.clicks ?? 0), n(tp?.impressions ?? 0), pct(tp?.ctr ?? 0), n(tp?.position ?? 0, 1)],
    ]), "gsc.totals");
  md += section("Search Console: top 200 consultas", g.queries, (r) => gscRows(r, "Consulta"), "gsc.queries");
  md += section("Search Console: top 100 páginas", g.pages, (r) => gscRows(r, "Página"), "gsc.pages");
  md += section("Search Console: consulta × página (top 300)", g.queryPage, (r) => gscRows(r, "Consulta → Página"), "gsc.queryPage");
  md += section("Search Console: dispositivos", g.devices, (r) => gscRows(r, "Dispositivo"), "gsc.devices");
  md += section("Search Console: países (top 10)", g.countries, (r) => gscRows(r, "País"), "gsc.countries");
  md += section("Search Console: sitemaps", g.sitemaps, (r) =>
    table(["Ruta", "Enviado", "Último download", "Pendiente", "Errores", "Advertencias", "Contenido"], r.map((s: Json) => [
      s.path, s.lastSubmitted ?? "-", s.lastDownloaded ?? "-", s.isPending ? "sí" : "no", s.errors ?? 0, s.warnings ?? 0,
      (s.contents ?? []).map((c: Json) => `${c.type}: ${c.submitted} enviadas/${c.indexed ?? "?"} indexadas`).join("; "),
    ])), "gsc.sitemaps");

  md += `\n# GA4\n`;
  const prevCh: Record<string, Json> = {};
  (a.channelsPrev ?? []).forEach((r: Json) => (prevCh[r.sessionDefaultChannelGroup] = r));
  md += section("GA4: canales", a.channels, (r) =>
    table(["Canal", "Sesiones", "Previo", "Usuarios", "Sesiones con interacción", "Tasa de interacción", "Duración prom. (s)"],
      r.map((x: Json) => [x.sessionDefaultChannelGroup, n(x.sessions), n(prevCh[x.sessionDefaultChannelGroup]?.sessions ?? 0), n(x.totalUsers), n(x.engagedSessions), pct(x.engagementRate), n(x.averageSessionDuration, 0)])), "ga4.channels");
  const lp = (r: Json[]) => table(["Landing page", "Sesiones", "Con interacción", "Eventos clave"], r.map((x) => [x.landingPage, n(x.sessions), n(x.engagedSessions), n(x.keyEvents)]));
  md += section("GA4: top 50 landing pages", a.landingPages, lp, "ga4.landingPages");
  md += section("GA4: landing pages de búsqueda orgánica", a.organicLandingPages, lp, "ga4.organicLandingPages");
  md += section("GA4: eventos", a.events, (r) => table(["Evento", "Cantidad"], r.map((x: Json) => [x.eventName, n(x.eventCount)])), "ga4.events");
  md += section("GA4: dispositivos", a.devices, (r) => table(["Dispositivo", "Sesiones", "Usuarios", "Con interacción"], r.map((x: Json) => [x.deviceCategory, n(x.sessions), n(x.totalUsers), n(x.engagedSessions)])), "ga4.devices");
  md += section("GA4: ciudades", a.cities, (r) => table(["Ciudad", "Sesiones", "Usuarios"], r.map((x: Json) => [x.city, n(x.sessions), n(x.totalUsers)])), "ga4.cities");
  md += section("GA4: países", a.countries, (r) => table(["País", "Sesiones", "Usuarios"], r.map((x: Json) => [x.country, n(x.sessions), n(x.totalUsers)])), "ga4.countries");
  if (Object.keys(o.errors).length) md += `\n## Errores\n\n` + Object.entries(o.errors).map(([k, v]) => `- **${k}**: ${v}`).join("\n") + "\n";
  return md;
}

main().catch((e) => { console.error(e?.message || e); process.exit(1); });
