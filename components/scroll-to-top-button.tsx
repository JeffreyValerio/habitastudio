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
      className="fixed bottom-28 right-6 z-50 flex items-center justify-center w-12 h-12 bg-muted/50 border border-border rounded-md shadow-lg hover:bg-muted transition-all duration-300 hover:scale-110 hover:shadow-xl"
      aria-label="Volver arriba"
    >
      <ChevronUp className="w-5 h-5 text-foreground" />
    </button>
  );
}

