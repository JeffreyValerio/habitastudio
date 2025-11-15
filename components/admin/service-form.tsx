"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createService, updateService } from "@/app/actions/services";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const serviceSchema = z.object({
  slug: z.string().min(1, "El slug es requerido"),
  title: z.string().min(1, "El título es requerido"),
  description: z.string().min(1, "La descripción es requerida"),
  longDescription: z.string().min(1, "La descripción larga es requerida"),
  features: z.string().optional(),
  process: z.string().optional(),
  benefits: z.string().optional(),
  icon: z.string().default("Home"),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

interface ServiceFormProps {
  service?: {
    id: string;
    slug: string;
    title: string;
    description: string;
    longDescription: string;
    features: string[];
    process: string[];
    benefits: string[];
    icon: string;
  };
}

const icons = [
  { value: "Home", label: "Home" },
  { value: "Hammer", label: "Hammer" },
  { value: "Palette", label: "Palette" },
  { value: "Wrench", label: "Wrench" },
];

export function ServiceForm({ service }: ServiceFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: service
      ? {
          slug: service.slug,
          title: service.title,
          description: service.description,
          longDescription: service.longDescription,
          features: service.features.join("\n"),
          process: service.process.join("\n"),
          benefits: service.benefits.join("\n"),
          icon: service.icon,
        }
      : undefined,
  });

  const title = watch("title");
  useEffect(() => {
    if (!service && title) {
      const slug = title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setValue("slug", slug);
    }
  }, [title, service, setValue]);

  const onSubmit = async (data: ServiceFormData) => {
    setIsSubmitting(true);
    try {
      const serviceData = {
        slug: data.slug,
        title: data.title,
        description: data.description,
        longDescription: data.longDescription,
        features: data.features
          ? data.features.split("\n").filter((f) => f.trim())
          : [],
        process: data.process
          ? data.process.split("\n").filter((p) => p.trim())
          : [],
        benefits: data.benefits
          ? data.benefits.split("\n").filter((b) => b.trim())
          : [],
        icon: data.icon,
      };

      if (service) {
        await updateService(service.id, serviceData);
        toast({
          title: "Éxito",
          description: "Servicio actualizado correctamente",
        });
      } else {
        await createService(serviceData);
        toast({
          title: "Éxito",
          description: "Servicio creado correctamente",
        });
      }

      router.push("/admin/services");
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al guardar el servicio",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="title">Título *</Label>
          <Input id="title" {...register("title")} />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug *</Label>
          <Input id="slug" {...register("slug")} />
          {errors.slug && (
            <p className="text-sm text-destructive">{errors.slug.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="icon">Icono</Label>
        <Select
          value={watch("icon")}
          onValueChange={(value) => setValue("icon", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar icono" />
          </SelectTrigger>
          <SelectContent>
            {icons.map((icon) => (
              <SelectItem key={icon.value} value={icon.value}>
                {icon.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción Corta *</Label>
        <Textarea id="description" rows={3} {...register("description")} />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="longDescription">Descripción Larga *</Label>
        <Textarea
          id="longDescription"
          rows={6}
          {...register("longDescription")}
        />
        {errors.longDescription && (
          <p className="text-sm text-destructive">
            {errors.longDescription.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="features">Características (una por línea)</Label>
        <Textarea
          id="features"
          rows={6}
          {...register("features")}
          placeholder="Consultoría de diseño personalizada&#10;Planeación y visualización 3D"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="process">Proceso (una por línea)</Label>
        <Textarea
          id="process"
          rows={6}
          {...register("process")}
          placeholder="Consulta inicial y análisis&#10;Desarrollo de concepto"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="benefits">Beneficios (una por línea)</Label>
        <Textarea
          id="benefits"
          rows={6}
          {...register("benefits")}
          placeholder="Espacios optimizados&#10;Aumento del valor de tu propiedad"
        />
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            service ? "Actualizar Servicio" : "Crear Servicio"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/services")}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}

