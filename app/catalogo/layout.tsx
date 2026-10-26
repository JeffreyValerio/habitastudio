import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Catálogo de Muebles a Medida",
  description: "Explora muebles a medida para tu hogar u oficina en Costa Rica: cocinas, closets, salas y más. Cotiza gratis con Habita Studio.",
  alternates: { canonical: "/catalogo" },
};

export default function CatalogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

