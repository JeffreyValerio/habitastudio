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
import { createUpdateProject } from "@/app/actions/projects";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const projectSchema = z.object({
  slug: z.string().min(1, "El slug es requerido"),
  title: z.string().min(1, "El título es requerido"),
  description: z.string().min(1, "La descripción es requerida"),
  longDescription: z.string().min(1, "La descripción larga es requerida"),
  // La imagen principal se gestiona via input file; no obligamos URL aquí
  image: z.string().optional(),
  category: z.string().min(1, "La categoría es requerida"),
  year: z.string().min(1, "El año es requerido"),
  location: z.string().optional(),
  duration: z.string().optional(),
  challenges: z.string().optional(),
  solutions: z.string().optional(),
  gallery: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  project?: {
    id: string;
    slug: string;
    title: string;
    description: string;
    longDescription: string;
    image: string;
    category: string;
    year: string;
    location?: string | null;
    duration?: string | null;
    challenges: string[];
    solutions: string[];
    gallery: string[];
  };
}

export function ProjectForm({ project }: ProjectFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gallery, setGallery] = useState<string[]>(project?.gallery || []);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFilesChange = (filesList: FileList | null) => {
    const files = filesList ? Array.from(filesList) : [];
    setNewFiles(files);
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
  };

  const removeGalleryUrl = (url: string) => {
    setGallery((prev) => prev.filter((u) => u !== url));
  };

  const removePreviewAt = (idx: number) => {
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
    setNewFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: project
      ? {
          slug: project.slug,
          title: project.title,
          description: project.description,
          longDescription: project.longDescription,
          image: project.image,
          category: project.category,
          year: project.year,
          location: project.location || "",
          duration: project.duration || "",
          challenges: project.challenges.join("\n"),
          solutions: project.solutions.join("\n"),
        }
      : undefined,
  });

  const title = watch("title");
  const imageUrl = project?.image || "";

  useEffect(() => {
    if (!project && title) {
      const slug = title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setValue("slug", slug);
    }
  }, [title, project, setValue]);

  const onSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      if (project?.id) formData.append("id", project.id);
      formData.append("slug", data.slug);
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("longDescription", data.longDescription);
      // Mantener imagen actual si no se sube una nueva
      if (project?.image) formData.append("imageUrl", project.image);
      formData.append("category", data.category);
      formData.append("year", data.year);
      if (data.location) formData.append("location", data.location);
      if (data.duration) formData.append("duration", data.duration);
      if (data.challenges) formData.append("challenges", data.challenges);
      if (data.solutions) formData.append("solutions", data.solutions);
      // Galería existente (URLs) y como JSON + imageUrls compat Arktee
      formData.append("gallery", JSON.stringify(gallery));
      gallery.forEach((url) => formData.append("imageUrls", url));
      // Archivos nuevos
      newFiles.forEach((f) => formData.append("images", f));
      // Archivo de imagen principal si se seleccionó
      const fileInput = document.getElementById("image") as HTMLInputElement | null;
      if (fileInput?.files?.[0]) {
        formData.append("image", fileInput.files[0]);
      }

      const result = await createUpdateProject(formData);

      if (result.ok) {
        toast({ title: "Éxito", description: result.message || "Proyecto guardado correctamente" });
        router.push("/admin/projects");
        router.refresh();
      } else {
        toast({ title: "Error", description: result.message || "Error al guardar el proyecto", variant: "destructive" });
      }

      router.push("/admin/projects");
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al guardar el proyecto",
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

        <div className="space-y-2">
          <Label htmlFor="category">Categoría *</Label>
          <Input id="category" {...register("category")} />
          {errors.category && (
            <p className="text-sm text-destructive">{errors.category.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="year">Año *</Label>
          <Input id="year" {...register("year")} placeholder="2024" />
          {errors.year && (
            <p className="text-sm text-destructive">{errors.year.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Ubicación</Label>
          <Input id="location" {...register("location")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Duración</Label>
          <Input id="duration" {...register("duration")} placeholder="6 semanas" />
        </div>
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <Label>Imágenes</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="image">Imagen Principal *</Label>
            {imageUrl && (
              <div className="relative w-full aspect-video overflow-hidden rounded-lg border mb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="Imagen principal actual" className="w-full h-full object-cover" />
              </div>
            )}
            <Input id="image" name="image" type="file" accept="image/*" />
            <p className="text-xs text-muted-foreground">
              {project ? "Deja vacío para mantener la imagen actual" : "Selecciona una imagen"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="images">Galería (archivos locales)</Label>
            <Input id="images" name="images" type="file" multiple accept="image/*" onChange={(e) => handleFilesChange(e.target.files)} />
            {(gallery.length > 0 || previews.length > 0) && (
              <div className="mt-2 grid grid-cols-2 gap-3">
                {gallery.map((url) => (
                  <div key={url} className="relative aspect-video w-full overflow-hidden rounded-md border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="Imagen existente" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeGalleryUrl(url)}
                      className="absolute top-2 right-2 rounded-md bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/80"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
                {previews.map((url, idx) => (
                  <div key={`new-${idx}`} className="relative aspect-video w-full overflow-hidden rounded-md border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Nueva imagen ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePreviewAt(idx)}
                      className="absolute top-2 right-2 rounded-md bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/80"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Selecciona varias imágenes; se cargarán al guardar.</p>
          </div>
        </div>
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
          rows={8}
          {...register("longDescription")}
        />
        {errors.longDescription && (
          <p className="text-sm text-destructive">
            {errors.longDescription.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="challenges">Desafíos (una por línea)</Label>
          <Textarea
            id="challenges"
            rows={6}
            {...register("challenges")}
            placeholder="Espacio limitado&#10;Integración de sistemas modernos"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="solutions">Soluciones (una por línea)</Label>
          <Textarea
            id="solutions"
            rows={6}
            {...register("solutions")}
            placeholder="Diseño de isla central multifuncional&#10;Sistema de almacenamiento optimizado"
          />
        </div>
      </div>



      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            project ? "Actualizar Proyecto" : "Crear Proyecto"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/projects")}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}

