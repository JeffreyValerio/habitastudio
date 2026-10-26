import type { Metadata } from "next";
import { Suspense } from "react";
import { AcceptInvitationForm } from "@/components/admin/accept-invitation-form";

export const metadata: Metadata = {
  title: "Aceptar invitación",
  robots: { index: false, follow: false },
};

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
      <AcceptInvitationForm />
    </Suspense>
  );
}
