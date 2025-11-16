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
import { Loader2, Home, Hammer, Palette, Wrench, Ruler, Paintbrush, Drill, Plug, PlugZap, Lightbulb, Fan, AirVent, ShowerHead, BedDouble, Sofa, Lamp, DoorOpen } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const serviceSchema = z.object({
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
    image?: string | null;
    features: string[];
    process: string[];
    benefits: string[];
    icon: string;
  };
}

const icons = [
  { value: "Home", label: "Home", Icon: Home },
  { value: "Hammer", label: "Hammer", Icon: Hammer },
  { value: "Palette", label: "Palette", Icon: Palette },
  { value: "Wrench", label: "Wrench", Icon: Wrench },
  { value: "Ruler", label: "Ruler", Icon: Ruler },
  { value: "Paintbrush", label: "Paintbrush", Icon: Paintbrush },
  { value: "Drill", label: "Drill", Icon: Drill },
  { value: "Plug", label: "Plug", Icon: Plug },
  { value: "PlugZap", label: "PlugZap", Icon: PlugZap },
  { value: "Lightbulb", label: "Lightbulb", Icon: Lightbulb },
  { value: "Fan", label: "Fan", Icon: Fan },
  { value: "AirVent", label: "AirVent", Icon: AirVent },
  { value: "ShowerHead", label: "ShowerHead", Icon: ShowerHead },
  { value: "BedDouble", label: "BedDouble", Icon: BedDouble },
  { value: "Sofa", label: "Sofa", Icon: Sofa },
  { value: "Lamp", label: "Lamp", Icon: Lamp },
  { value: "DoorOpen", label: "DoorOpen", Icon: DoorOpen },
];

export function ServiceForm({ service }: ServiceFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(service?.image || null);
  const [isDraggingImage, setIsDraggingImage] = useState(false);

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

  const slugify = (str: string) =>
    (str || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const onSubmit = async (data: ServiceFormData) => {
    setIsSubmitting(true);
    try {
      // 1) Subir imagen si existe al folder basado en el slug
      let imageUrl: string | undefined = undefined;
      if (imageFile) {
        const slug = slugify(data.title);
        const body = new FormData();
        body.append("file", imageFile);
        body.append("folder", `habita-studio/services/${slug}`);
        const res = await fetch("/api/upload", { method: "POST", body });
        if (!res.ok) {
          throw new Error("No se pudo subir la imagen");
        }
        const json = await res.json();
        imageUrl = json.url as string;
      }

      const serviceData = {
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
        ...(imageUrl ? { image: imageUrl } : {}),
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

        {/* Slug se genera automáticamente en el servidor */}
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
          <SelectContent className="max-h-[340px]">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 p-1">
              {icons.map(({ value, label, Icon }) => (
                <SelectItem key={value} value={value} className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    <span>{label}</span>
                  </div>
                </SelectItem>
              ))}
            </div>
          </SelectContent>
        </Select>
      </div>

      {/* Imagen del servicio (una sola) */}
      <div className="space-y-2">
        <Label htmlFor="serviceImage">Imagen del Servicio</Label>
        <Input
          id="serviceImage"
          name="serviceImage"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && file.type.startsWith("image/")) {
              setImageFile(file);
              setImagePreview(URL.createObjectURL(file));
            }
          }}
        />
        <label
          htmlFor="serviceImage"
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDraggingImage(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDraggingImage(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDraggingImage(false);
            const file = e.dataTransfer?.files?.[0];
            if (file && file.type.startsWith("image/")) {
              setImageFile(file);
              setImagePreview(URL.createObjectURL(file));
            }
          }}
          className={`flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDraggingImage ? "border-primary bg-primary/5" : "border-border hover:border-primary hover:bg-primary/5"}`}
        >
          <div className="text-center">
            <p className="text-sm font-medium">
              Arrastra y suelta una imagen aquí
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              o haz clic para seleccionar (solo una)
            </p>
          </div>
        </label>
        {imagePreview && (
          <div className="mt-2 relative aspect-video w-full overflow-hidden rounded-md border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreview} alt="Imagen del servicio" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => {
                setImageFile(null);
                setImagePreview(null);
              }}
              className="absolute top-2 right-2 rounded-md bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/80"
            >
              Quitar
            </button>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          La imagen se adjuntará al guardar (1 archivo máximo).
        </p>
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

