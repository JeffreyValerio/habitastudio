"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InviteUserForm } from "@/components/admin/invite-user-form";
import { CreateUserForm } from "@/components/admin/create-user-form";
import { Mail, UserPlus } from "lucide-react";

export function UserCreationPanel() {
  const [tab, setTab] = useState<"invite" | "create">("invite");

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          {tab === "invite" ? <Mail className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
          Agregar Usuario
        </CardTitle>
        <div className="flex gap-4 border-b -mb-3 pt-2">
          <button
            type="button"
            onClick={() => setTab("invite")}
            className={`px-1 pb-2 text-sm font-medium border-b-2 transition-colors ${
              tab === "invite"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Invitar por Email
          </button>
          <button
            type="button"
            onClick={() => setTab("create")}
            className={`px-1 pb-2 text-sm font-medium border-b-2 transition-colors ${
              tab === "create"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Crear Directamente
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {tab === "invite" ? <InviteUserForm hideCard /> : <CreateUserForm />}
      </CardContent>
    </Card>
  );
}
