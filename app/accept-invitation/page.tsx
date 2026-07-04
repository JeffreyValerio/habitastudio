import { Suspense } from "react";
import { AcceptInvitationForm } from "@/components/admin/accept-invitation-form";

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
      <AcceptInvitationForm />
    </Suspense>
  );
}
