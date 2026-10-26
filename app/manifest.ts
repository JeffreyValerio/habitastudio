import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Habita Studio",
    short_name: "Habita Studio",
    description: "Muebles, diseño y remodelación de calidad.",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F4EF",
    theme_color: "#F7F4EF",
    icons: [
      { src: "/brand/favicon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/favicon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
