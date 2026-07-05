"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { createCustomer, updateCustomer } from "@/app/actions/crm";
import { Loader2 } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "prospect", label: "Prospecto" },
  { value: "qualified", label: "Calificado" },
  { value: "negotiation", label: "Negociación" },
  { value: "customer", label: "Cliente" },
  { value: "inactive", label: "Inactivo" },
];

const SOURCE_OPTIONS = [
  { value: "website", label: "Sitio Web" },
  { value: "referral", label: "Referido" },
  { value: "cold-call", label: "Llamada en frío" },
  { value: "social", label: "Redes Sociales" },
  { value: "event", label: "Evento" },
  { value: "other", label: "Otro" },
];

interface CustomerFormProps {
  customer?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    company: string | null;
    position: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
    status: string;
    source: string | null;
  };
}

export function CustomerForm({ customer }: CustomerFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState(customer?.name || "");
  const [email, setEmail] = useState(customer?.email || "");
  const [phone, setPhone] = useState(customer?.phone || "");
  const [company, setCompany] = useState(customer?.company || "");
  const [position, setPosition] = useState(customer?.position || "");
  const [address, setAddress] = useState(customer?.address || "");
  const [city, setCity] = useState(customer?.city || "");
  const [country, setCountry] = useState(customer?.country || "");
  const [status, setStatus] = useState(customer?.status || "prospect");
  const [source, setSource] = useState(customer?.source || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email) {
      toast({ title: "Error", description: "Nombre y email son requeridos", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      if (customer) {
        await updateCustomer(customer.id, {
          name,
          email,
          phone: phone || undefined,
          company: company || undefined,
          position: position || undefined,
          address: address || undefined,
          city: city || undefined,
          country: country || undefined,
          status,
          source: source || undefined,
        });
        toast({ title: "Éxito", description: "Cliente actualizado" });
        router.push(`/admin/crm/customers/${customer.id}`);
      } else {
        const created = await createCustomer({
          name,
          email,
          phone: phone || undefined,
          company: company || undefined,
          position: position || undefined,
          address: address || undefined,
          city: city || undefined,
          country: country || undefined,
          source: source || undefined,
        });
        toast({ title: "Éxito", description: "Cliente creado" });
        router.push(`/admin/crm/customers/${created.id}`);
      }
      router.refresh();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Error al guardar", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Juan Pérez" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="juan@ejemplo.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="8888-8888" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="position">Puesto</Label>
              <Input id="position" value={position} onChange={(e) => setPosition(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Ciudad</Label>
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">País</Label>
              <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Costa Rica" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customer && (
              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="source">Fuente</Label>
              <select
                id="source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
              >
                <option value="">Sin especificar</option>
                {SOURCE_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-4 pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {customer ? "Actualizar" : "Crear Cliente"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
