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
import { ImageUpload } from "@/components/admin/image-upload";
import { MultiImageUpload } from "@/components/admin/multi-image-upload";
import { createProject, updateProject } from "@/app/actions/projects";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const projectSchema = z.object({
  slug: z.string().min(1, "El slug es requerido"),
  title: z.string().min(1, "El título es requerido"),
  description: z.string().min(1, "La descripción es requerida"),
  longDescription: z.string().min(1, "La descripción larga es requerida"),
  image: z.string().url("Debe ser una URL válida"),
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
  const imageUrl = watch("image");

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
      const projectData = {
        slug: data.slug,
        title: data.title,
        description: data.description,
        longDescription: data.longDescription,
        image: data.image,
        category: data.category,
        year: data.year,
        location: data.location || undefined,
        duration: data.duration || undefined,
        challenges: data.challenges
          ? data.challenges.split("\n").filter((c) => c.trim())
          : [],
        solutions: data.solutions
          ? data.solutions.split("\n").filter((s) => s.trim())
          : [],
        gallery: gallery,
      };

      if (project) {
        await updateProject(project.id, projectData, {
          image: project.image,
          gallery: project.gallery,
        });
        toast({
          title: "Éxito",
          description: "Proyecto actualizado correctamente",
        });
      } else {
        await createProject(projectData);
        toast({
          title: "Éxito",
          description: "Proyecto creado correctamente",
        });
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

      <div className="space-y-2">
        <Label htmlFor="image">Imagen Principal *</Label>
        <ImageUpload
          value={imageUrl}
          onChange={(url) => setValue("image", url)}
          folder="habita-studio/projects"
        />
        {errors.image && (
          <p className="text-sm text-destructive">{errors.image.message}</p>
        )}
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

      <div className="space-y-2">
        <Label>Galería de Imágenes</Label>
        <MultiImageUpload
          values={gallery}
          onChange={setGallery}
          folder="habita-studio/projects"
          maxImages={10}
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

