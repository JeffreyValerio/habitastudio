"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { ScrollToTopButton } from "@/components/scroll-to-top-button";
import type { CatalogCategory } from "@/lib/catalog-categories";
import { Analytics } from "@/components/site/analytics";
import { MobileActionBar } from "@/components/site/mobile-action-bar";

export function MainWrapper({
  children,
  categories = [],
}: {
  children: React.ReactNode;
  categories?: CatalogCategory[];
}) {
  const pathname = usePathname();
  const isPortal =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/taller-manager") ||
    pathname.startsWith("/collaborator");

  if (isPortal) {
    // Analytics renders nothing here but flips GA's opt-out flag if the tag was loaded earlier.
    return (
      <>
        {children}
        <Analytics />
      </>
    );
  }

  return (
    <div className="site-public min-h-screen bg-hs-bg text-hs-text">
      <Header />
      <main className="min-h-screen">{children}</main>
      <Footer categories={categories} />
      <ScrollToTopButton />
      <WhatsAppButton />
      <MobileActionBar />
      <Analytics />
    </div>
  );
}
