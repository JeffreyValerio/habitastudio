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
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-16 h-16 bg-[#25D366] rounded-full shadow-lg hover:bg-[#20BA5A] transition-all duration-300 hover:scale-110 hover:shadow-xl"
      aria-label="Contactar por WhatsApp"
    >
      <Icons.whatsapp className="w-10 h-10" />
    </Link>
  );
}

