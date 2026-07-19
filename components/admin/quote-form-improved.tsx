"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatCRC, todayInCostaRica, addDaysToDateString } from "@/lib/utils";
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
import { Card } from "@/components/ui/card";
import { createUpdateQuote } from "@/app/actions/quotes";
import { getProductsForQuotes } from "@/app/actions/products";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { QuoteClientSelector } from "./quote-client-selector";
import { QuotePreviewPanel } from "./quote-preview-panel";

interface QuoteItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  productId?: string;
  cabysCode?: string | null;
  unidadMedida?: string;
}

interface ProductForQuote {
  id: string;
  name: string;
  price: number;
  category: string;
  cabysCode: string | null;
  unidadMedida: string;
}

interface Customer {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
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

interface QuoteFormImprovedProps {
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
  recentCustomersData?: Customer[];
}

export function QuoteFormImproved({
  quote,
  recentCustomersData = [],
}: QuoteFormImprovedProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"client" | "items" | "notes">("client");
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

  const getTaxPercent = (quote: QuoteFormImprovedProps["quote"]) => {
    if (!quote || quote.subtotal === 0) return "13";
    return ((quote.tax / quote.subtotal) * 100).toFixed(2);
  };

  const getDiscountPercent = (quote: QuoteFormImprovedProps["quote"]) => {
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

  useEffect(() => {
    if (!quote) {
      setValue("validUntil", addDaysToDateString(todayInCostaRica(), 15));
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
      item.productId = undefined;
    } else {
      const product = products.find((p) => p.id === productId);
      if (product) {
        item.productId = productId;
        item.description = product.name;
        item.unitPrice = product.price;
        item.total = item.quantity * item.unitPrice;
        item.cabysCode = product.cabysCode;
        item.unidadMedida = product.unidadMedida;
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
    const validItems = items.filter((item) => item.description && item.description.trim() && item.quantity > 0 && item.unitPrice > 0);

    if (validItems.length === 0) {
      toast({
        title: "Error",
        description: "Debe agregar al menos un item válido",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
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

      formData.append("gallery", JSON.stringify(gallery));
      gallery.forEach((url) => formData.append("imageUrls", url));
      newFiles.forEach((f) => formData.append("images", f));

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
        toast({
          title: "Error",
          description: result.message || "Error al guardar",
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
  const clientName = watch("clientName");
  const projectName = watch("projectName");

  const TabButton = ({ tab, label }: { tab: "client" | "items" | "notes"; label: string }) => (
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Main Form */}
      <form onSubmit={handleSubmit(onSubmit)} encType="multipart/form-data" className="lg:col-span-3 space-y-6">
        {/* Tabs Navigation */}
        <div className="border-b flex gap-4">
          <TabButton tab="client" label="👤 Cliente" />
          <TabButton tab="items" label="📋 Items" />
          <TabButton tab="notes" label="🖼️ Imágenes y anotaciones" />
        </div>

        {/* Tab: Cliente */}
        {activeTab === "client" && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Seleccionar Cliente</h3>
              {recentCustomersData.length > 0 && (
                <QuoteClientSelector
                  recentCustomersData={recentCustomersData}
                  onSelectCustomer={(customer) => {
                    if (customer.name) setValue("clientName", customer.name);
                    if (customer.email) setValue("clientEmail", customer.email);
                    if (customer.phone) setValue("clientPhone", customer.phone);
                  }}
                />
              )}
            </div>

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
                <Label htmlFor="clientEmail">Email *</Label>
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
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
              <Label htmlFor="clientAddress">Dirección</Label>
              <Textarea
                id="clientAddress"
                {...register("clientAddress")}
                placeholder="Calle, número, ciudad..."
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
              <Label htmlFor="projectDescription">Descripción</Label>
              <Textarea
                id="projectDescription"
                {...register("projectDescription")}
                placeholder="Detalles del proyecto..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="validUntil">Válida hasta</Label>
                <Input
                  id="validUntil"
                  type="date"
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
          </div>
        )}

        {/* Tab: Items */}
        {activeTab === "items" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Items de la Cotización *</Label>
              <Button type="button" onClick={addItem} variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Agregar Item
              </Button>
            </div>

            <div className="border rounded-lg overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-medium text-sm">Descripción</th>
                    <th className="text-center p-3 font-medium text-sm w-24">Cant.</th>
                    <th className="text-right p-3 font-medium text-sm w-32">Precio Unit.</th>
                    <th className="text-right p-3 font-medium text-sm w-32">Total</th>
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
                            <SelectTrigger className="w-[160px] shrink-0 text-xs">
                              <SelectValue placeholder="Producto" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="manual">Manual</SelectItem>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            value={item.description}
                            onChange={(e) => updateItem(index, "description", e.target.value)}
                            placeholder="Descripción"
                            className="flex-1 text-sm"
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
                          className="w-full text-center font-mono text-base"
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, "unitPrice", e.target.value)}
                          onFocus={(e) => e.currentTarget.select()}
                          className="w-full text-right font-mono text-base font-medium"
                        />
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-lg text-primary">
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
        )}

        {/* Tab: Notas e Imágenes */}
        {activeTab === "notes" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="notes">Notas Adicionales</Label>
              <Textarea
                id="notes"
                {...register("notes")}
                placeholder="Notas para el cliente..."
                rows={4}
              />
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <Label>Imágenes de Referencia</Label>
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
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary"
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
                      <Image
                        src={url}
                        alt="Imagen"
                        fill
                        className="object-cover"
                        unoptimized
                      />
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
                      <Image
                        src={url}
                        alt="Nueva"
                        fill
                        className="object-cover"
                        unoptimized
                      />
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

        {/* Submit Buttons */}
        <div className="border-t pt-4 flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {quote ? "Actualizar" : "Crear Cotización"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>

      {/* Sidebar Preview */}
      <div className="lg:col-span-1">
        <QuotePreviewPanel
          clientName={clientName || "Cliente"}
          projectName={projectName || "Proyecto"}
          items={items}
          subtotal={subtotal}
          tax={taxAmount}
          discount={discountAmount}
          total={total}
          status={watch("status")}
        />
      </div>
    </div>
  );
}
