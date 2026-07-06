"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { addWorkOrderImages, removeWorkOrderImage } from "@/app/actions/work-orders";
import { Loader2, X } from "lucide-react";

export function WorkOrderImages({
  workOrderId,
  images,
  canEdit,
}: {
  workOrderId: string;
  images: string[];
  canEdit: boolean;
}) {
  const { toast } = useToast();
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removingUrl, setRemovingUrl] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!lightboxUrl) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxUrl(null);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [lightboxUrl]);

  const handleFilesChange = (filesList: FileList | File[] | null) => {
    const files = filesList ? Array.from(filesList) : [];
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) return;

    setNewFiles((prev) => [...prev, ...imageFiles]);
    setPreviews((prev) => [...prev, ...imageFiles.map((f) => URL.createObjectURL(f))]);
  };

  const removePreviewAt = (idx: number) => {
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
    setNewFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpload = async () => {
    if (newFiles.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      newFiles.forEach((f) => formData.append("images", f));
      await addWorkOrderImages(workOrderId, formData);
      toast({ title: "Éxito", description: "Imágenes agregadas" });
      setNewFiles([]);
      setPreviews([]);
      window.location.reload();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Error al subir imágenes", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (url: string) => {
    setRemovingUrl(url);
    try {
      await removeWorkOrderImage(workOrderId, url);
      toast({ title: "Éxito", description: "Imagen eliminada" });
      window.location.reload();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setRemovingUrl(null);
    }
  };

  if (!canEdit && images.length === 0) {
    return <p className="text-center text-muted-foreground py-8">Sin imágenes aún</p>;
  }

  return (
    <div className="space-y-4">
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {images.map((url, idx) => (
            <div
              key={url}
              className="relative aspect-video overflow-hidden rounded-md border cursor-pointer"
              onClick={() => setLightboxUrl(url)}
            >
              <Image src={url} alt={`Imagen ${idx + 1}`} fill className="object-cover" unoptimized />
              {canEdit && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(url);
                  }}
                  disabled={removingUrl === url}
                  className="absolute top-2 right-2 rounded bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/80"
                >
                  {removingUrl === url ? "..." : "✕"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {canEdit && (
        <div className="space-y-3">
          <input
            id={`wo-images-${workOrderId}`}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleFilesChange(e.target.files)}
            className="hidden"
          />
          <label
            htmlFor={`wo-images-${workOrderId}`}
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
            className={`flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary"
            }`}
          >
            <p className="text-sm font-medium">Arrastra y suelta imágenes</p>
            <p className="text-xs text-muted-foreground">o haz clic para seleccionar (varias a la vez)</p>
          </label>

          {previews.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {previews.map((url, idx) => (
                <div
                  key={url}
                  className="relative aspect-video overflow-hidden rounded-md border cursor-pointer"
                  onClick={() => setLightboxUrl(url)}
                >
                  <Image src={url} alt="Nueva" fill className="object-cover" unoptimized />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removePreviewAt(idx);
                    }}
                    className="absolute top-2 right-2 rounded bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/80"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {newFiles.length > 0 && (
            <Button onClick={handleUpload} disabled={uploading} size="sm">
              {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar {newFiles.length > 1 ? `${newFiles.length} Imágenes` : "Imagen"}
            </Button>
          )}
        </div>
      )}

      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxUrl(null)}
            aria-label="Cerrar"
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          <div
            className="relative w-full h-full max-w-5xl max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image src={lightboxUrl} alt="Vista completa" fill className="object-contain" unoptimized />
          </div>
        </div>
      )}
    </div>
  );
}
