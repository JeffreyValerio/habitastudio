"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import {
  GA_ID,
  STAFF_COOKIE,
  trackContactClick,
  trackQuoteRequestClick,
} from "@/lib/analytics";

const isProd = process.env.NODE_ENV === "production";

function isPortalPath(pathname: string) {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/taller-manager") ||
    pathname.startsWith("/collaborator")
  );
}

function hasStaffCookie() {
  return document.cookie.split("; ").some((c) => c === `${STAFF_COOKIE}=1`);
}

/**
 * GA4 for the public site only. Loads in production, with an ID, and never for
 * logged-in staff or on portal routes. Also wires delegated click tracking for
 * WhatsApp / tel: / mailto: links and [data-track-quote] CTAs.
 */
export function Analytics() {
  const pathname = usePathname();
  const portal = isPortalPath(pathname);
  const [state, setState] = useState<"checking" | "ok" | "staff">("checking");

  useEffect(() => {
    setState(hasStaffCookie() ? "staff" : "ok");
  }, [pathname]);

  const enabled = isProd && !!GA_ID && !portal && state === "ok";

  // If the script was loaded on a public page and the user then client-navigates
  // into a portal (or is staff), GA's own opt-out flag silences it.
  useEffect(() => {
    if (!GA_ID) return;
    (window as unknown as Record<string, unknown>)[`ga-disable-${GA_ID}`] = !enabled;
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.("a");
      if (!el) return;
      const href = el.getAttribute("href") || "";
      const location = el.getAttribute("data-track-location") || "unknown";
      const product = el.getAttribute("data-track-product") || undefined;
      if (href.includes("wa.me")) trackContactClick("whatsapp", location, product);
      else if (href.startsWith("tel:")) trackContactClick("phone", location);
      else if (href.startsWith("mailto:")) trackContactClick("email", location);
      else if (el.hasAttribute("data-track-quote")) trackQuoteRequestClick(location, product);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [enabled]);

  if (!enabled) return null;
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${GA_ID}');
      `}</Script>
    </>
  );
}
