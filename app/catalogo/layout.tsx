import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Catálogo de Productos",
  description: "Explora nuestro catálogo completo de muebles de calidad. Salas, comedores, dormitorios, oficinas y más. Encuentra el mueble perfecto para tu espacio.",
};

export default function CatalogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

