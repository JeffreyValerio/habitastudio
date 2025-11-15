"use client";

import { useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { CldUploadWidget } from "next-cloudinary";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
}

export function ImageUpload({ value, onChange, folder = "habita-studio" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  return (
    <div className="space-y-4">
      {value && (
        <div className="relative w-full h-64 rounded-lg overflow-hidden border">
          <Image
            src={value}
            alt="Preview"
            fill
            className="object-cover"
            unoptimized
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={() => onChange("")}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      <CldUploadWidget
        uploadPreset="habita-studio"
        options={{
          folder,
          maxFiles: 1,
        }}
        onSuccess={(result: any) => {
          if (result?.info?.secure_url) {
            onChange(result.info.secure_url);
          }
        }}
      >
        {({ open }) => {
          return (
            <Button
              type="button"
              variant="outline"
              onClick={() => open()}
              disabled={uploading}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {value ? "Cambiar Imagen" : "Subir Imagen"}
                </>
              )}
            </Button>
          );
        }}
      </CldUploadWidget>
    </div>
  );
}

