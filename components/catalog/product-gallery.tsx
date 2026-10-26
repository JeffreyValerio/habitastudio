"use client";

import Image from "next/image";
import { useState } from "react";

type ProductGalleryProps = {
  image: string;
  gallery?: string[];
  video?: string | null;
  name: string;
  aspect?: "product" | "square" | "video";
  fit?: "cover" | "contain";
};

export function ProductGallery({ image, gallery = [], video, name, aspect = "product", fit = "cover" }: ProductGalleryProps) {
  const initial = video || image || gallery[0] || "";
  const [current, setCurrent] = useState<string>(initial);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  // El video, si hay, va primero — es el medio destacado del producto.
  const thumbs = [
    ...(video ? [video] : []),
    image,
    ...gallery.filter((u) => u && u !== image),
  ];
  const all = thumbs;
  const isVideoUrl = (url: string) => !!video && url === video;

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

  const FOCUS =
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hs-accent";
  const aspectClass =
    aspect === "video" ? "aspect-video" : aspect === "square" ? "aspect-square" : "aspect-[4/3.4]";

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Ampliar imagen"
        className={`group relative ${aspectClass} w-full overflow-hidden bg-hs-placeholder ${FOCUS}`}
      >
        {current && isVideoUrl(current) ? (
          <video
            src={current}
            className="absolute inset-0 h-full w-full object-contain"
            controls
            playsInline
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          current && (
            <Image
              src={current}
              alt={name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 60vw"
              className={fit === "contain" ? "object-contain" : "object-cover"}
              unoptimized
            />
          )
        )}
      </button>

      {thumbs.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {thumbs.map((url, idx) => {
            const active = current === url;
            return (
              <button
                type="button"
                key={`${url}-${idx}`}
                onClick={() => setCurrent(url)}
                aria-label={`Ver imagen ${idx + 1}`}
                aria-pressed={active}
                className={`relative aspect-[4/3] min-h-[44px] w-full overflow-hidden bg-hs-placeholder border-2 ${active ? "border-hs-text" : "border-transparent"} ${FOCUS}`}
              >
                {isVideoUrl(url) ? (
                  <>
                    <video src={url} muted className="absolute inset-0 h-full w-full object-cover" />
                    <span className="absolute inset-0 flex items-center justify-center bg-hs-text/30 text-xs font-semibold uppercase tracking-wider text-white">
                      Video
                    </span>
                  </>
                ) : (
                  <Image
                    src={url}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 25vw, 15vw"
                    className="object-cover"
                    unoptimized
                  />
                )}
              </button>
            );
          })}
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
              className="absolute top-3 right-3 z-10 bg-black/60 px-3 py-2 text-white hover:bg-black/80"
            >
              Cerrar
            </button>
            {all.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Anterior"
                  onClick={prev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 bg-black/60 px-3 py-2 text-white hover:bg-black/80"
                >
                  ‹
                </button>
                <button
                  type="button"
                  aria-label="Siguiente"
                  onClick={next}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-black/60 px-3 py-2 text-white hover:bg-black/80"
                >
                  ›
                </button>
              </>
            )}
            <div className="relative w-full h-full overflow-hidden">
              {isVideoUrl(current) ? (
                <video src={current} className="h-full w-full object-contain" controls autoPlay playsInline />
              ) : (
                <Image
                  src={current}
                  alt={name}
                  fill
                  sizes="100vw"
                  className="object-contain"
                  unoptimized
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


