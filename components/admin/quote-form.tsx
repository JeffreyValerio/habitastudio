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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createUpdateQuote } from "@/app/actions/quotes";
import { getProductsForQuotes } from "@/app/actions/products";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2 } from "lucide-react";
import Image from "next/image";

interface QuoteItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  productId?: string;
}

interface ProductForQuote {
  id: string;
  name: string;
  price: number;
  category: string;
}

const quoteFormSchema = z.object({
  clientName: z.string().min(1, "El nombre del cliente es requerido"),
  clientEmail: z
    .preprocess(
      (val) => {
        if (val === null || val === "" || val === undefined) return undefined;
        return val;
      },
      z.string().email("Email inválido").optional()
    ),
  clientPhone: z.string().optional(),
  clientAddress: z.string().optional(),
  projectName: z.string().min(1, "El nombre del proyecto es requerido"),
  projectDescription: z.string().optional(),
  status: z.enum(["draft", "sent", "accepted", "rejected", "expired"]),
  validUntil: z.string().optional(),
  tax: z.string(),
  discount: z.string(),
  notes: z.string().optional(),
});

type QuoteFormData = z.infer<typeof quoteFormSchema>;

interface QuoteFormProps {
  quote?: {
    id: string;
    quoteNumber: string;
    clientName: string;
    clientEmail?: string | null;
    clientPhone?: string | null;
    clientAddress?: string | null;
    projectName: string;
    projectDescription?: string | null;
    status: string;
    validUntil: Date | null;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    notes?: string | null;
    images?: string[];
    items: QuoteItem[];
  };
}

export function QuoteForm({ quote }: QuoteFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [items, setItems] = useState<QuoteItem[]>(
    quote?.items || [
      { description: "", quantity: 1, unitPrice: 0, total: 0 },
    ]
  );
  const [products, setProducts] = useState<ProductForQuote[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [gallery, setGallery] = useState<string[]>(quote?.images || []);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Cargar productos al montar el componente
  useEffect(() => {
    async function loadProducts() {
      try {
        const productsData = await getProductsForQuotes();
        setProducts(productsData);
      } catch (error) {
        console.error("Error cargando productos:", error);
      } finally {
        setLoadingProducts(false);
      }
    }
    loadProducts();
  }, []);

  const handleFilesChange = (filesList: FileList | File[] | null) => {
    const files = filesList ? Array.from(filesList) : [];
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) return;

    setNewFiles((prev) => [...prev, ...imageFiles]);
    const urls = imageFiles.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...urls]);
  };

  const removeGalleryUrl = (url: string) => {
    setGallery((prev) => prev.filter((u) => u !== url));
  };

  const removePreviewAt = (idx: number) => {
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
    setNewFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // Calcular porcentaje de impuesto desde el monto guardado
  const getTaxPercent = (quote: QuoteFormProps["quote"]) => {
    if (!quote || quote.subtotal === 0) return "13";
    return ((quote.tax / quote.subtotal) * 100).toFixed(2);
  };

  // Calcular porcentaje de descuento desde el monto guardado
  const getDiscountPercent = (quote: QuoteFormProps["quote"]) => {
    if (!quote || quote.subtotal === 0) return "0";
    return ((quote.discount / quote.subtotal) * 100).toFixed(2);
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<QuoteFormData>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: quote
      ? {
        clientName: quote.clientName,
        clientEmail: quote.clientEmail || "",
        clientPhone: quote.clientPhone || "",
        clientAddress: quote.clientAddress || "",
        projectName: quote.projectName,
        projectDescription: quote.projectDescription || "",
        status: quote.status as "draft" | "sent" | "accepted" | "rejected" | "expired",
        validUntil: quote.validUntil
          ? new Date(quote.validUntil).toISOString().split("T")[0]
          : "",
        tax: getTaxPercent(quote),
        discount: getDiscountPercent(quote),
        notes: quote.notes || "",
      }
      : {
        status: "draft",
        tax: "13",
        discount: "0",
      },
  });

  // Establecer fecha de vencimiento automáticamente a 15 días cuando se crea una nueva cotización
  useEffect(() => {
    if (!quote) {
      const today = new Date();
      const validUntilDate = new Date(today);
      validUntilDate.setDate(today.getDate() + 15);
      const formattedDate = validUntilDate.toISOString().split("T")[0];
      setValue("validUntil", formattedDate);
    }
  }, [quote, setValue]);

  const tax = parseFloat(watch("tax") || "0");
  const discount = parseFloat(watch("discount") || "0");

  const updateItem = (index: number, field: keyof QuoteItem, value: string | number) => {
    const newItems = [...items];
    const item = { ...newItems[index] };

    if (field === "description") {
      item.description = value as string;
    } else if (field === "quantity") {
      item.quantity = parseFloat(value as string) || 0;
    } else if (field === "unitPrice") {
      item.unitPrice = parseFloat(value as string) || 0;
    } else if (field === "productId") {
      item.productId = value as string;
    }

    item.total = item.quantity * item.unitPrice;
    newItems[index] = item;
    setItems(newItems);
  };

  const handleProductSelect = (index: number, productId: string) => {
    const newItems = [...items];
    const item = { ...newItems[index] };

    if (productId === "manual") {
      // Limpiar producto seleccionado para escribir manualmente
      item.productId = undefined;
    } else {
      // Seleccionar producto y autocompletar
      const product = products.find((p) => p.id === productId);
      if (product) {
        item.productId = productId;
        item.description = product.name;
        item.unitPrice = product.price;
        item.total = item.quantity * item.unitPrice;
      }
    }

    newItems[index] = item;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = (subtotal * tax) / 100;
    const discountAmount = (subtotal * discount) / 100;
    const total = subtotal + taxAmount - discountAmount;
    return { subtotal, taxAmount, discountAmount, total };
  };

  const onSubmit = async (data: QuoteFormData) => {
    // Filtrar items vacíos o sin descripción
    const validItems = items.filter((item) => item.description && item.description.trim() && item.quantity > 0 && item.unitPrice > 0);

    if (validItems.length === 0) {
      toast({
        title: "Error",
        description: "Debe agregar al menos un item válido con descripción, cantidad y precio",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Calcular totales con items válidos
      const validSubtotal = validItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const taxPercent = parseFloat(data.tax) || 0;
      const discountPercent = parseFloat(data.discount) || 0;
      const validTaxAmount = (validSubtotal * taxPercent) / 100;
      const validDiscountAmount = (validSubtotal * discountPercent) / 100;
      const validTotal = validSubtotal + validTaxAmount - validDiscountAmount;
      const formData = new FormData();

      if (quote?.id) {
        formData.append("id", quote.id);
      }

      formData.append("clientName", data.clientName);
      formData.append("clientEmail", data.clientEmail ?? "");
      formData.append("clientPhone", data.clientPhone || "");
      formData.append("clientAddress", data.clientAddress || "");
      formData.append("projectName", data.projectName);
      formData.append("projectDescription", data.projectDescription || "");
      formData.append("status", data.status);
      formData.append("validUntil", data.validUntil || "");
      formData.append("subtotal", validSubtotal.toString());
      formData.append("tax", validTaxAmount.toString());
      formData.append("discount", validDiscountAmount.toString());
      formData.append("total", validTotal.toString());
      formData.append("notes", data.notes || "");

      // Agregar galería como JSON y como lista de URLs (compat productos/proyectos)
      formData.append("gallery", JSON.stringify(gallery));
      gallery.forEach((url) => formData.append("imageUrls", url));

      // Agregar múltiples archivos nuevos para la galería
      newFiles.forEach((f) => formData.append("images", f));

      // Enviar solo items válidos
      const validItemsToSend = validItems.map(item => ({
        description: item.description.trim(),
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice,
      }));

      formData.append("items", JSON.stringify(validItemsToSend));

      const result = await createUpdateQuote(formData);

      if (result.ok) {
        toast({
          title: "Éxito",
          description: result.message,
        });
        router.push("/admin/quotes");
      } else {
        console.error("Error details:", result.errors || result.message);
        toast({
          title: "Error",
          description: result.message || "Error al guardar la cotización",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al guardar la cotización",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const { subtotal, taxAmount, discountAmount, total } = calculateTotals();

  const formatCRC = (value: number) =>
    `CRC ${new Intl.NumberFormat("es-CR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)}`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} encType="multipart/form-data" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="clientName">Nombre del Cliente *</Label>
          <Input
            id="clientName"
            {...register("clientName")}
            placeholder="Juan Pérez"
          />
          {errors.clientName && (
            <p className="text-sm text-destructive">{errors.clientName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="clientEmail">Email del Cliente (opcional)</Label>
          <Input
            id="clientEmail"
            type="email"
            {...register("clientEmail")}
            placeholder="cliente@ejemplo.com"
          />
          {errors.clientEmail && (
            <p className="text-sm text-destructive">{errors.clientEmail.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="clientPhone">Teléfono</Label>
          <Input
            id="clientPhone"
            type="tel"
            {...register("clientPhone")}
            placeholder="+506 1234 5678"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Estado</Label>
          <select
            id="status"
            {...register("status")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="draft">Borrador</option>
            <option value="sent">Enviada</option>
            <option value="accepted">Aceptada</option>
            <option value="rejected">Rechazada</option>
            <option value="expired">Expirada</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="clientAddress">Dirección del Cliente</Label>
        <Textarea
          id="clientAddress"
          {...register("clientAddress")}
          placeholder="Calle, número, colonia, ciudad, estado, CP"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="projectName">Nombre del Proyecto *</Label>
        <Input
          id="projectName"
          {...register("projectName")}
          placeholder="Remodelación de Cocina"
        />
        {errors.projectName && (
          <p className="text-sm text-destructive">{errors.projectName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="projectDescription">Descripción del Proyecto</Label>
        <Textarea
          id="projectDescription"
          {...register("projectDescription")}
          placeholder="Descripción detallada del proyecto..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="validUntil">Válida hasta</Label>
          <Input
            id="validUntil"
            type="date"
            className="date-input-white-icon"
            {...register("validUntil")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tax">Impuesto (%)</Label> 
          <Input
            id="tax"
            type="number"
            step="0.01"
            {...register("tax")}
            placeholder="13"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="discount">Descuento (%)</Label>
          <Input
            id="discount"
            type="number"
            step="0.01"
            {...register("discount")}
            placeholder="0"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Items de la Cotización *</Label>
          <Button type="button" onClick={addItem} variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Agregar Item
          </Button>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <colgroup>
              <col className="w-[40%]" />
              <col className="w-[7.5rem]" />
              <col className="w-[9rem]" />
              <col className="w-[9rem]" />
              <col className="w-[3rem]" />
            </colgroup>
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 text-sm font-medium">Producto / Descripción</th>
                <th className="text-left p-3 text-sm font-medium">Cantidad</th>
                <th className="text-left p-3 text-sm font-medium">Precio Unitario</th>
                <th className="text-right p-3 text-sm font-medium">Total</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="border-t">
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Select
                        value={item.productId || "manual"}
                        onValueChange={(value) => handleProductSelect(index, value)}
                        disabled={loadingProducts}
                      >
                        <SelectTrigger className="w-[200px] shrink-0">
                          <SelectValue placeholder="Producto" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">Producto manual</SelectItem>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} - {product.category} ({formatCRC(product.price)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(index, "description", e.target.value)}
                        placeholder="Descripción del item"
                        className="flex-1"
                      />
                    </div>
                  </td>
                  <td className="p-3">
                    <Input
                      type="number"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", e.target.value)}
                      onFocus={(e) => e.currentTarget.select()}
                      inputMode="decimal"
                      min="0"
                      className="w-full text-right font-mono"
                    />
                  </td>
                  <td className="p-3">
                    <Input
                      type="number"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, "unitPrice", e.target.value)}
                      placeholder="0.00"
                      onFocus={(e) => e.currentTarget.select()}
                      inputMode="decimal"
                      min="0"
                      className="w-full text-right font-mono"
                    />
                  </td>
                  <td className="p-3 text-right font-medium font-mono tabular-nums">
                    {formatCRC(item.total)}
                  </td>
                  <td className="p-3">
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas Adicionales</Label>
        <Textarea
          id="notes"
          {...register("notes")}
          placeholder="Notas adicionales para el cliente..."
          rows={4}
        />
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <Label>Imágenes de Referencia</Label>
        <div className="space-y-2">
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
              e.stopPropagation();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
              if (e.dataTransfer?.files?.length) {
                handleFilesChange(e.dataTransfer.files);
              }
            }}
            className={`flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary hover:bg-primary/5"}`}
          >
            <div className="text-center">
              <p className="text-sm font-medium">Arrastra y suelta imágenes aquí</p>
              <p className="text-xs text-muted-foreground mt-1">o haz clic para seleccionar</p>
            </div>
          </label>
          {(gallery.length > 0 || previews.length > 0) && (
            <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-3">
              {gallery.map((url, idx) => (
                <div key={`existing-${idx}`} className="relative aspect-video w-full overflow-hidden rounded-md border">
                  <Image
                    src={url}
                    alt="Imagen existente"
                    fill
                    className="object-cover"
                    unoptimized
                  />
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
                  <Image
                    src={url}
                    alt={`Nueva imagen ${idx + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
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
          <p className="text-xs text-muted-foreground">
            Las imágenes se mostrarán al final del PDF después del resumen de precios. Selecciona varias imágenes; se cargarán al guardar.
          </p>
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="flex justify-end">
          <div className="w-full max-w-md space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-medium">{formatCRC(subtotal)}</span>
            </div>
            {taxAmount > 0 && (
              <div className="flex justify-between">
                <span>Impuesto ({tax}%):</span>
                <span className="font-medium">{formatCRC(taxAmount)}</span>
              </div>
            )}
            {discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Descuento ({discount}%):</span>
                <span className="font-medium">-{formatCRC(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span>{formatCRC(total)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {quote ? "Actualizar Cotización" : "Crear Cotización"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

