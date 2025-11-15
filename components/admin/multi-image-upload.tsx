"use client";

import { useState } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { CldUploadWidget } from "next-cloudinary";

interface MultiImageUploadProps {
  values: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  maxImages?: number;
}

export function MultiImageUpload({
  values,
  onChange,
  folder = "habita-studio",
  maxImages = 10,
}: MultiImageUploadProps) {
  const handleRemove = (index: number) => {
    const newValues = values.filter((_, i) => i !== index);
    onChange(newValues);
  };

  return (
    <div className="space-y-4">
      {values.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {values.map((url, index) => (
            <div key={index} className="relative aspect-video rounded-lg overflow-hidden border">
              <Image
                src={url}
                alt={`Gallery ${index + 1}`}
                fill
                className="object-cover"
                unoptimized
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={() => handleRemove(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
      {values.length < maxImages && (
        <CldUploadWidget
          uploadPreset="habita-studio"
          options={{
            folder,
            maxFiles: maxImages - values.length,
            multiple: true,
          }}
          onSuccess={(result: any) => {
            if (result?.info) {
              const newUrls = Array.isArray(result.info)
                ? result.info.map((item: any) => item.secure_url)
                : [result.info.secure_url];
              onChange([...values, ...newUrls]);
            }
          }}
        >
          {({ open }) => {
            return (
              <Button
                type="button"
                variant="outline"
                onClick={() => open()}
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                Agregar Imágenes ({values.length}/{maxImages})
              </Button>
            );
          }}
        </CldUploadWidget>
      )}
    </div>
  );
}

