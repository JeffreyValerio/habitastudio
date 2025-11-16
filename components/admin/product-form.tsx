"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createUpdateProduct } from "@/app/actions/products";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { MultiImageUpload } from "@/components/admin/multi-image-upload";

const productSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  slug: z.string().min(1, "El slug es requerido"),
  category: z.string().min(1, "La categoría es requerida"),
  cost: z.string().optional(),
  price: z.string().min(1, "El precio es requerido"),
  description: z.string().min(1, "La descripción es requerida"),
  features: z.string().optional(),
  material: z.string().optional(),
  dimensions: z.string().optional(),
  color: z.string().optional(),
  warranty: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: {
    id: string;
    name: string;
    slug: string;
    category: string;
    cost: number;
    price: number;
    image: string;
    description: string;
    features: string[];
    material?: string | null;
    dimensions?: string | null;
    color?: string | null;
    warranty?: string | null;
  };
}

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gallery, setGallery] = useState<string[]>(product?.['gallery' as any] || []);

  const formatCurrency = (amount: number): string => {
    // Para inputs tipo number, solo devolver el número sin formato
    return amount.toString();
  };

  const parseCurrency = (value: string | number): number => {
    if (typeof value === 'number') return value;
    return parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0;
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          name: product.name,
          slug: product.slug,
          category: product.category,
          cost: formatCurrency(product.cost || 0),
          price: formatCurrency(product.price),
          description: product.description,
          features: product.features.join("\n"),
          material: product.material || "",
          dimensions: product.dimensions || "",
          color: product.color || "",
          warranty: product.warranty || "",
        }
      : undefined,
  });

  const cost = watch("cost");
  const price = watch("price");

  const calculateMargin = (): number => {
    const costNum = parseCurrency(cost || "0");
    const priceNum = parseCurrency(price || "0");
    if (priceNum === 0) return 0;
    return ((priceNum - costNum) / priceNum) * 100;
  };

  const margin = calculateMargin();

  // Generar slug automáticamente desde el nombre
  const name = watch("name");
  useEffect(() => {
    if (!product && name) {
      const slug = name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setValue("slug", slug);
    }
  }, [name, product, setValue]);

  const onSubmit = async (data: ProductFormData, event?: React.BaseSyntheticEvent) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      
      if (product?.id) {
        formData.append("id", product.id);
      }
      
      formData.append("name", data.name);
      formData.append("slug", data.slug);
      formData.append("category", data.category);
      formData.append("cost", parseCurrency(data.cost || "0").toString());
      formData.append("price", parseCurrency(data.price).toString());
      formData.append("description", data.description);
      if (data.features) formData.append("features", data.features);
      if (data.material) formData.append("material", data.material);
      if (data.dimensions) formData.append("dimensions", data.dimensions);
      if (data.color) formData.append("color", data.color);
      if (data.warranty) formData.append("warranty", data.warranty);

      // Si hay una imagen existente (URL), agregarla
      if (product?.image) {
        formData.append("imageUrl", product.image);
      }
      // Agregar galería como JSON
      formData.append("gallery", JSON.stringify(gallery));

      // Agregar el archivo del input si existe
      const fileInput = event?.target?.image as HTMLInputElement;
      if (fileInput?.files?.[0]) {
        formData.append("image", fileInput.files[0]);
      }

      const result = await createUpdateProduct(formData);

      if (result.ok) {
        toast({
          title: "Éxito",
          description: result.message || "Producto guardado correctamente",
        });
        router.push("/admin/products");
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.message || "Error al guardar el producto",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al guardar el producto",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} encType="multipart/form-data" className="space-y-6 max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre *</Label>
          <Input id="name" {...register("name")} />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
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
          <Label htmlFor="cost">Costo (CRC)</Label>
          <Input 
            id="cost" 
            {...register("cost")} 
            placeholder="500000" 
            type="number"
            step="0.01"
          />
          <p className="text-xs text-muted-foreground">Costo del producto (solo visible en admin)</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Precio de Venta (CRC) *</Label>
          <Input 
            id="price" 
            {...register("price")} 
            placeholder="750000" 
            type="number"
            step="0.01"
            required
          />
          {errors.price && (
            <p className="text-sm text-destructive">{errors.price.message}</p>
          )}
          <p className="text-xs text-muted-foreground">Precio que se muestra al cliente</p>
        </div>
      </div>

      {(cost && parseCurrency(cost || "0") > 0) && (
        <div className="rounded-lg border bg-muted/50 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Costo</p>
              <p className="text-lg font-semibold">
                {new Intl.NumberFormat("es-CR", {
                  style: "currency",
                  currency: "CRC",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(parseCurrency(cost || "0"))}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Precio de Venta</p>
              <p className="text-lg font-semibold">
                {new Intl.NumberFormat("es-CR", {
                  style: "currency",
                  currency: "CRC",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(parseCurrency(price || "0"))}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Margen de Ganancia</p>
              <p className={`text-lg font-semibold ${margin >= 0 ? "text-green-600" : "text-red-600"}`}>
                {margin.toFixed(2)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Ganancia: {new Intl.NumberFormat("es-CR", {
                  style: "currency",
                  currency: "CRC",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(parseCurrency(price || "0") - parseCurrency(cost || "0"))}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="image">Imagen *</Label>
        {product?.image && (
          <div className="relative w-full h-64 rounded-lg overflow-hidden border mb-4">
            <Image
              src={product.image}
              alt="Preview"
              fill
              className="object-cover"
            />
          </div>
        )}
        <Input
          id="image"
          name="image"
          type="file"
          accept="image/*"
        />
        <p className="text-sm text-muted-foreground">
          {product ? "Deja vacío para mantener la imagen actual" : "Selecciona una imagen"}
        </p>
      </div>

      <div className="space-y-2">
        <Label>Galería de Imágenes</Label>
        <MultiImageUpload
          values={gallery}
          onChange={setGallery}
          folder="habita-studio/products/gallery"
          maxImages={10}
        />
        <p className="text-xs text-muted-foreground">Puedes agregar varias imágenes del producto.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción *</Label>
        <Textarea
          id="description"
          rows={4}
          {...register("description")}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="features">Características (una por línea)</Label>
        <Textarea
          id="features"
          rows={6}
          {...register("features")}
          placeholder="Estructura de madera sólida&#10;Tapizado en tela premium&#10;Almohadas incluidas"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="material">Material</Label>
          <Input id="material" {...register("material")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dimensions">Dimensiones</Label>
          <Input id="dimensions" {...register("dimensions")} placeholder="220cm x 95cm x 85cm" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="color">Colores Disponibles</Label>
          <Input id="color" {...register("color")} placeholder="Gris, Beige, Azul marino" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="warranty">Garantía</Label>
          <Input id="warranty" {...register("warranty")} placeholder="2 años" />
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
            product ? "Actualizar Producto" : "Crear Producto"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/products")}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}

