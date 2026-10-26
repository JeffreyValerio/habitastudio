// Google Analytics 4 helpers (client-safe). The tag is only loaded in production
// on public pages for non-staff visitors (see components/site/analytics.tsx), so
// `track` is effectively a no-op everywhere else. Never send personal data.

export const GA_ID = process.env.NEXT_PUBLIC_GOOGLE_ID;

/** Harmless, non-httpOnly flag cookie set at login so analytics can skip staff. NOT used for auth. */
export const STAFF_COOKIE = "hs_staff";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

// gtag loads afterInteractive, i.e. after hydration, so events fired on mount
// (view_item) would run before window.gtag exists. Queue and flush once it
// appears; give up after ~10s (dev, staff and blocked trackers never load it).
const pending: [string, Record<string, unknown>][] = [];
let flushTries = 0;

function disabled() {
  return GA_ID ? (window as unknown as Record<string, unknown>)[`ga-disable-${GA_ID}`] === true : true;
}

function flush() {
  if (window.gtag) {
    for (const [event, params] of pending.splice(0)) window.gtag("event", event, params);
    return;
  }
  if (++flushTries > 40) {
    pending.length = 0;
    return;
  }
  setTimeout(flush, 250);
}

export function track(event: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined" || !GA_ID || disabled()) return;
  if (window.gtag && pending.length === 0) {
    window.gtag("event", event, params);
    return;
  }
  pending.push([event, params]);
  if (pending.length === 1) {
    flushTries = 0;
    flush();
  }
}

export type ClickChannel = "whatsapp" | "phone" | "email";

const CLICK_EVENTS: Record<ClickChannel, string> = {
  whatsapp: "contact_whatsapp",
  phone: "contact_phone",
  email: "contact_email",
};

export function trackContactClick(channel: ClickChannel, location: string, product?: string) {
  track(CLICK_EVENTS[channel], { location, ...(product ? { product } : {}) });
}

export function trackQuoteRequestClick(location: string, product?: string) {
  track("quote_request_click", { location, ...(product ? { product } : {}) });
}

export function trackLead(params: { subject: string; product?: string; service?: string }) {
  track("generate_lead", {
    form: "contacto",
    subject: params.subject,
    ...(params.product ? { product: params.product } : {}),
    ...(params.service ? { service: params.service } : {}),
  });
}

export function trackViewProduct(p: { slug: string; name: string; category?: string }) {
  track("view_item", {
    items: [{ item_id: p.slug, item_name: p.name, item_category: p.category }],
  });
}
