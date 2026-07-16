"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { formatCRC } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createUpdateProduct } from "@/app/actions/products";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Package } from "lucide-react";
import { AiSuggestButton } from "@/components/admin/ai-suggest-button";

const productSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
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
    gallery?: string[];
  };
}

type ProductFormExtraProps = {
  cloudName?: string;
  uploadPreset?: string;
};

export function ProductForm({ product, cloudName, uploadPreset }: ProductFormProps & ProductFormExtraProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "pricing" | "images" | "details">("info");
  const [gallery, setGallery] = useState<string[]>(product?.gallery || []);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);

  const handleFilesChange = (filesList: FileList | File[] | null) => {
    const files = filesList ? Array.from(filesList) : [];
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) return;

    setNewFiles((prev) => [...prev, ...imageFiles]);
    const urls = imageFiles.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...urls]);
  };

  const handleMainImageChange = (file: File | null) => {
    if (!file) {
      setMainImagePreview(null);
      return;
    }
    setMainImagePreview(URL.createObjectURL(file));
  };

  const removeGalleryUrl = (url: string) => {
    setGallery((prev) => prev.filter((u) => u !== url));
  };

  const removePreviewAt = (idx: number) => {
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
    setNewFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const formatCurrency = (amount: number): string => amount.toString();

  const parseCurrency = (value: string | number): number => {
    if (typeof value === "number") return value;
    return parseFloat(String(value).replace(/[^0-9.]/g, "")) || 0;
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
  const name = watch("name");
  const category = watch("category");
  const description = watch("description");
  const features = watch("features");

  const calculateMargin = (): number => {
    const costNum = parseCurrency(cost || "0");
    const priceNum = parseCurrency(price || "0");
    if (priceNum === 0) return 0;
    return ((priceNum - costNum) / priceNum) * 100;
  };

  const margin = calculateMargin();

  const uploadToCloudinary = async (file: File, folder: string): Promise<string> => {
    const body = new FormData();
    body.append("file", file);
    body.append("folder", folder);
    const res = await fetch("/api/upload", { method: "POST", body });
    if (!res.ok) {
      throw new Error(`No se pudo subir la imagen "${file.name}"`);
    }
    const json = await res.json();
    return json.url as string;
  };

  const onSubmit = async (data: ProductFormData, event?: React.BaseSyntheticEvent) => {
    setIsSubmitting(true);
    try {
      // Subir imágenes directo a Cloudinary vía /api/upload ANTES de llamar
      // al Server Action: si los archivos viajan dentro del body del Server
      // Action, pueden superar el límite de payload de la plataforma
      // (~4.5MB en Vercel) y la acción falla con una respuesta no-RSC que
      // el cliente no puede interpretar ("unexpected response").
      const fileInput = (event?.target as HTMLFormElement)?.querySelector("#image") as HTMLInputElement | null;
      const mainImageFile = fileInput?.files?.[0] || null;

      let uploadedImageUrl: string | null = null;
      if (mainImageFile) {
        uploadedImageUrl = await uploadToCloudinary(mainImageFile, "habita-studio/products");
      }

      const uploadedGalleryUrls: string[] = [];
      if (newFiles.length > 0) {
        const results = await Promise.allSettled(
          newFiles.map((f) => uploadToCloudinary(f, "habita-studio/products/gallery"))
        );
        const failed = results.filter((r) => r.status === "rejected").length;
        for (const r of results) {
          if (r.status === "fulfilled") uploadedGalleryUrls.push(r.value);
        }
        if (failed > 0) {
          toast({
            title: "Aviso",
            description: `${failed} imagen(es) de la galería no se pudieron subir.`,
            variant: "destructive",
          });
        }
      }

      const finalGallery = [...gallery, ...uploadedGalleryUrls];

      const formData = new FormData();

      if (product?.id) {
        formData.append("id", product.id);
      }

      formData.append("name", data.name);
      formData.append("category", data.category);
      formData.append("cost", parseCurrency(data.cost || "0").toString());
      formData.append("price", parseCurrency(data.price).toString());
      formData.append("description", data.description);
      if (data.features) formData.append("features", data.features);
      if (data.material) formData.append("material", data.material);
      if (data.dimensions) formData.append("dimensions", data.dimensions);
      if (data.color) formData.append("color", data.color);
      if (data.warranty) formData.append("warranty", data.warranty);

      if (uploadedImageUrl || product?.image) {
        formData.append("imageUrl", uploadedImageUrl || product!.image);
      }
      formData.append("gallery", JSON.stringify(finalGallery));

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

  const TabButton = ({ tab, label }: { tab: typeof activeTab; label: string }) => (
    <button
      type="button"
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 font-medium border-b-2 transition-colors ${
        activeTab === tab
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );

  const displayImage = mainImagePreview || product?.image;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Main Form */}
      <form onSubmit={handleSubmit(onSubmit)} encType="multipart/form-data" className="lg:col-span-3 space-y-6">
        {/* Tabs Navigation */}
        <div className="border-b flex gap-4 overflow-x-auto">
          <TabButton tab="info" label="📦 Información" />
          <TabButton tab="pricing" label="💰 Precios" />
          <TabButton tab="images" label="🖼️ Imágenes" />
          <TabButton tab="details" label="📋 Detalles" />
        </div>

        {/* Tab: Información */}
        {activeTab === "info" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="name">Nombre *</Label>
                  <AiSuggestButton
                    field="name"
                    body={{ text: name, category }}
                    disabled={!name?.trim()}
                    onResult={(v) =>
                      setValue("name", v.charAt(0).toUpperCase() + v.slice(1), { shouldValidate: true })
                    }
                  />
                </div>
                <Input id="name" {...register("name")} placeholder="Sofá Moderno 3 Plazas" />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoría *</Label>
                <Input id="category" {...register("category")} placeholder="Sala" />
                {errors.category && (
                  <p className="text-sm text-destructive">{errors.category.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description">Descripción *</Label>
                <AiSuggestButton
                  field="description"
                  body={{ text: description, category }}
                  disabled={!description?.trim()}
                  onResult={(v) => setValue("description", v, { shouldValidate: true })}
                />
              </div>
              <Textarea
                id="description"
                rows={5}
                {...register("description")}
                placeholder="Describe el producto..."
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>
          </div>
        )}

        {/* Tab: Precios */}
        {activeTab === "pricing" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="cost">Costo (CRC)</Label>
                <Input id="cost" {...register("cost")} type="number" step="0.01" className="text-base font-mono" />
                <p className="text-xs text-muted-foreground">Solo visible en admin</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Precio de Venta (CRC) *</Label>
                <Input
                  id="price"
                  {...register("price")}
                  type="number"
                  step="0.01"
                  required
                  className="text-base font-mono font-medium"
                />
                {errors.price && (
                  <p className="text-sm text-destructive">{errors.price.message}</p>
                )}
                <p className="text-xs text-muted-foreground">Precio visible al cliente</p>
              </div>
            </div>

            {cost && parseCurrency(cost || "0") > 0 && (
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Costo</p>
                    <p className="text-lg font-semibold font-mono">
                      {formatCRC(parseCurrency(cost || "0"), 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Precio de Venta</p>
                    <p className="text-lg font-semibold font-mono">
                      {formatCRC(parseCurrency(price || "0"), 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Margen de Ganancia</p>
                    <p className={`text-lg font-semibold ${margin >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {margin.toFixed(2)}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ganancia: {formatCRC(parseCurrency(price || "0") - parseCurrency(cost || "0"), 0)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Imágenes */}
        {activeTab === "images" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="image">Imagen Principal *</Label>
              {displayImage && (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden border mb-2">
                  <Image src={displayImage} alt="Preview" fill className="object-cover" unoptimized={!!mainImagePreview} />
                </div>
              )}
              <Input
                id="image"
                name="image"
                type="file"
                accept="image/*"
                onChange={(e) => handleMainImageChange(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground">
                {product ? "Deja vacío para mantener la imagen actual" : "Selecciona una imagen"}
              </p>
            </div>

            <div className="space-y-2 rounded-lg border p-4">
              <Label>Galería de Imágenes</Label>
              <Input
                id="images"
                name="images"
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFilesChange(e.target.files)}
                className="hidden"
              />
              <label
                htmlFor="images"
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleFilesChange(e.dataTransfer?.files);
                }}
                className={`flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary"
                }`}
              >
                <div className="text-center">
                  <p className="text-sm font-medium">Arrastra y suelta imágenes</p>
                  <p className="text-xs text-muted-foreground">o haz clic para seleccionar</p>
                </div>
              </label>

              {(gallery.length > 0 || previews.length > 0) && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                  {gallery.map((url, idx) => (
                    <div key={`existing-${idx}`} className="relative aspect-video overflow-hidden rounded-md border">
                      <Image src={url} alt="Imagen" fill className="object-cover" unoptimized />
                      <button
                        type="button"
                        onClick={() => removeGalleryUrl(url)}
                        className="absolute top-2 right-2 rounded bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/80"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {previews.map((url, idx) => (
                    <div key={`new-${idx}`} className="relative aspect-video overflow-hidden rounded-md border">
                      <Image src={url} alt="Nueva" fill className="object-cover" unoptimized />
                      <button
                        type="button"
                        onClick={() => removePreviewAt(idx)}
                        className="absolute top-2 right-2 rounded bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/80"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Detalles */}
        {activeTab === "details" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="features">Características (una por línea)</Label>
                <AiSuggestButton
                  field="features"
                  label="Generar con IA"
                  body={{ text: features, category, name }}
                  disabled={!name?.trim()}
                  onResult={(v) => setValue("features", v, { shouldValidate: true })}
                />
              </div>
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
                <Input id="material" {...register("material")} placeholder="Madera y tela" />
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
          </div>
        )}

        {/* Submit Buttons */}
        <div className="border-t pt-4 flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {product ? "Actualizar Producto" : "Crear Producto"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/admin/products")}>
            Cancelar
          </Button>
        </div>
      </form>

      {/* Sidebar Preview */}
      <div className="lg:col-span-1">
        <Card className="sticky top-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Vista Previa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative w-full aspect-video rounded-lg overflow-hidden border bg-muted flex items-center justify-center">
              {displayImage ? (
                <Image src={displayImage} alt="Preview" fill className="object-cover" unoptimized={!!mainImagePreview} />
              ) : (
                <Package className="h-10 w-10 text-muted-foreground" />
              )}
            </div>

            <div className="space-y-1 border-b pb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase">
                Producto
              </p>
              <p className="text-sm font-medium truncate">{name || "Sin nombre"}</p>
              {category && (
                <p className="text-xs text-muted-foreground">{category}</p>
              )}
            </div>

            <div className="flex justify-between items-center bg-primary/10 rounded-lg p-3">
              <span className="font-semibold text-sm">Precio:</span>
              <span className="text-lg font-bold text-primary font-mono">
                {formatCRC(parseCurrency(price || "0"), 0)}
              </span>
            </div>

            {cost && parseCurrency(cost || "0") > 0 && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Margen:</span>
                <span className={margin >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                  {margin.toFixed(1)}%
                </span>
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center">
              Actualiza los campos para ver cambios
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
