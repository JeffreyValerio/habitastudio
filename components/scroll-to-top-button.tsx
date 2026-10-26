"use client";

import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";

export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Mostrar el botón cuando el usuario haya hecho scroll más de 300px
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);

    return () => {
      window.removeEventListener("scroll", toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-24 right-4 md:bottom-28 md:right-6 z-50 flex items-center justify-center w-12 h-12 bg-hs-surface border border-hs-border hover:bg-hs-successBg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hs-accent"
      aria-label="Volver arriba"
    >
      <ChevronUp className="w-5 h-5 text-foreground" />
    </button>
  );
}

