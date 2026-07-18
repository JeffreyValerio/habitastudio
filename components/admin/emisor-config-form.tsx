"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveEmisorConfig } from "@/app/actions/electronic-documents";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const TIPOS_IDENTIFICACION = [
  { value: "01", label: "01 - Cédula Física" },
  { value: "02", label: "02 - Cédula Jurídica" },
  { value: "03", label: "03 - DIMEX" },
  { value: "04", label: "04 - NITE" },
];

interface EmisorConfigFormData {
  nombre: string;
  nombreComercial: string;
  identificacionTipo: string;
  identificacionNumero: string;
  actividadEconomica: string;
  provincia: string;
  canton: string;
  distrito: string;
  barrio: string;
  otrasSenas: string;
  telefonoCodigoPais: string;
  telefono: string;
  correoElectronico: string;
}

interface EmisorConfigRecord {
  nombre: string;
  nombreComercial: string | null;
  identificacionTipo: string;
  identificacionNumero: string;
  actividadEconomica: string;
  provincia: string;
  canton: string;
  distrito: string;
  barrio: string | null;
  otrasSenas: string;
  telefonoCodigoPais: string;
  telefono: string;
  correoElectronico: string;
}

export function EmisorConfigForm({
  emisorConfig,
}: {
  emisorConfig: EmisorConfigRecord | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
  } = useForm<EmisorConfigFormData>({
    defaultValues: emisorConfig
      ? { ...emisorConfig, nombreComercial: emisorConfig.nombreComercial || "", barrio: emisorConfig.barrio || "" }
      : {
          nombre: "",
          nombreComercial: "",
          identificacionTipo: "02",
          identificacionNumero: "",
          actividadEconomica: "",
          provincia: "",
          canton: "",
          distrito: "",
          barrio: "",
          otrasSenas: "",
          telefonoCodigoPais: "506",
          telefono: "",
          correoElectronico: "",
        },
  });

  const identificacionTipo = watch("identificacionTipo");

  const onSubmit = async (data: EmisorConfigFormData) => {
    setIsSubmitting(true);
    try {
      const result = await saveEmisorConfig({
        ...data,
        nombreComercial: data.nombreComercial || undefined,
        barrio: data.barrio || undefined,
      });
      if (result.ok) {
        toast({ title: "Éxito", description: "Datos del emisor guardados correctamente" });
        router.refresh();
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Error al guardar", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Identificación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre / Razón Social *</Label>
              <Input id="nombre" {...register("nombre", { required: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nombreComercial">Nombre Comercial</Label>
              <Input id="nombreComercial" {...register("nombreComercial")} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Identificación *</Label>
              <Select value={identificacionTipo} onValueChange={(v) => setValue("identificacionTipo", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_IDENTIFICACION.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="identificacionNumero">Número de Identificación *</Label>
              <Input id="identificacionNumero" {...register("identificacionNumero", { required: true })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="actividadEconomica">Código de Actividad Económica *</Label>
            <Input
              id="actividadEconomica"
              {...register("actividadEconomica", { required: true })}
              placeholder="ej. 4719.9 (con el punto, tal como lo muestra Hacienda)"
            />
            <p className="text-xs text-muted-foreground">
              Va literal con el punto — no son 6 dígitos numéricos, son 6 caracteres.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ubicación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="provincia">Provincia *</Label>
              <Input id="provincia" {...register("provincia", { required: true })} placeholder="1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="canton">Cantón *</Label>
              <Input id="canton" {...register("canton", { required: true })} placeholder="08" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="distrito">Distrito *</Label>
              <Input id="distrito" {...register("distrito", { required: true })} placeholder="02" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="barrio">Barrio</Label>
            <Input id="barrio" {...register("barrio")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="otrasSenas">Otras Señas *</Label>
            <Textarea id="otrasSenas" rows={3} {...register("otrasSenas", { required: true })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contacto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefonoCodigoPais">Código País</Label>
              <Input id="telefonoCodigoPais" {...register("telefonoCodigoPais", { required: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono *</Label>
              <Input id="telefono" {...register("telefono", { required: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="correoElectronico">Correo Electrónico *</Label>
              <Input id="correoElectronico" type="email" {...register("correoElectronico", { required: true })} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Guardar
      </Button>
    </form>
  );
}
