"use client";

import { Icons } from "@/components/icons";
import Link from "next/link";

export function WhatsAppButton() {
  // Número de WhatsApp
  const whatsappNumber = "50663644915";
  const whatsappMessage = "Hola, me interesa conocer más sobre sus servicios.";
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <Link
      href={whatsappUrl}
      data-track-location="floating_button"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 hidden md:flex items-center justify-center w-16 h-16 bg-[#25D366] hover:bg-[#20BA5A] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hs-text"
      aria-label="Contactar por WhatsApp"
    >
      <Icons.whatsapp className="w-10 h-10" />
    </Link>
  );
}

