import { SITE_CONFIG } from "@/lib/site-config";
import { SiteButtonLink } from "./site-button";

const WHATSAPP_URL = SITE_CONFIG.whatsappUrl;

export function MobileActionBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 gap-2 border-t border-hs-border bg-hs-bg px-4 py-3 md:hidden">
      <SiteButtonLink
        href={WHATSAPP_URL}
        data-track-location="mobile_action_bar"
        target="_blank"
        rel="noopener noreferrer"
        variant="secondary"
        className="px-4 text-sm"
      >
        WhatsApp
      </SiteButtonLink>
      <SiteButtonLink
        href="/contacto"
        data-track-quote
        data-track-location="mobile_action_bar"
        className="px-4 text-sm"
      >
        Cotizar
      </SiteButtonLink>
    </div>
  );
}
