"use client";

import Image from "next/image";
import { useState } from "react";

type ProductGalleryProps = {
  image: string;
  gallery?: string[];
  name: string;
  aspect?: "square" | "video";
  fit?: "cover" | "contain";
};

export function ProductGallery({ image, gallery = [], name, aspect = "square", fit = "cover" }: ProductGalleryProps) {
  const initial = image || gallery[0] || "";
  const [current, setCurrent] = useState<string>(initial);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const thumbs = [image, ...gallery.filter((u) => u && u !== image)];
  const all = thumbs;

  const currentIndex = all.findIndex((u) => u === current);
  const prev = () => {
    if (all.length < 2) return;
    const idx = (currentIndex - 1 + all.length) % all.length;
    setCurrent(all[idx]);
  };
  const next = () => {
    if (all.length < 2) return;
    const idx = (currentIndex + 1) % all.length;
    setCurrent(all[idx]);
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`group relative ${aspect === "video" ? "aspect-video" : "aspect-square"} w-full overflow-hidden rounded-lg border bg-muted focus:outline-none focus:ring-2 focus:ring-primary`}
      >
        {current && (
          <Image
            src={current}
            alt={name}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className={`${fit === "contain" ? "object-contain" : "object-cover"} transition-transform duration-300 group-hover:scale-105`}
            unoptimized
          />
        )}
      </button>

      {thumbs.length > 1 && (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
          {thumbs.map((url, idx) => (
            <button
              type="button"
              key={`${url}-${idx}`}
              onClick={() => setCurrent(url)}
              className={`relative aspect-square w-full overflow-hidden rounded-md border focus:outline-none focus:ring-2 focus:ring-primary ${current === url ? "ring-2 ring-primary" : ""}`}
            >
              <Image
                src={url}
                alt={`${name} ${idx + 1}`}
                fill
                sizes="(max-width: 768px) 33vw, 25vw"
                className="object-cover"
                unoptimized
              />
            </button>
          ))}
        </div>
      )}

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setIsOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setIsOpen(false);
            if (e.key === "ArrowLeft") prev();
            if (e.key === "ArrowRight") next();
          }}
          tabIndex={-1}
        >
          <div
            className="relative w-[92vw] h-[82vh] max-w-6xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Cerrar"
              onClick={() => setIsOpen(false)}
              className="absolute top-3 right-3 z-10 rounded-md bg-black/60 px-3 py-2 text-white hover:bg-black/80"
            >
              Cerrar
            </button>
            {all.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Anterior"
                  onClick={prev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 rounded-md bg-black/60 px-3 py-2 text-white hover:bg-black/80"
                >
                  ‹
                </button>
                <button
                  type="button"
                  aria-label="Siguiente"
                  onClick={next}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 rounded-md bg-black/60 px-3 py-2 text-white hover:bg-black/80"
                >
                  ›
                </button>
              </>
            )}
            <div className="relative w-full h-full overflow-hidden rounded-lg">
              <Image
                src={current}
                alt={name}
                fill
                sizes="100vw"
                className="object-contain"
                unoptimized
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


