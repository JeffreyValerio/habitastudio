import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, User } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog",
  description: "Artículos sobre tendencias en diseño de interiores, consejos de decoración, casos de estudio y más. Mantente al día con las últimas tendencias en muebles y remodelaciones.",
};

const blogPosts = [
  {
    id: 1,
    title: "Tendencias en Diseño de Interiores 2024",
    excerpt: "Descubre las últimas tendencias en diseño de interiores que están marcando este año.",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop",
    author: "Equipo Habita Studio",
    date: "15 Marzo 2024",
    category: "Tendencias",
  },
  {
    id: 2,
    title: "Cómo Elegir los Muebles Perfectos para tu Sala",
    excerpt: "Guía completa para seleccionar muebles que se adapten a tu espacio y estilo de vida.",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop",
    author: "Equipo Habita Studio",
    date: "10 Marzo 2024",
    category: "Consejos",
  },
  {
    id: 3,
    title: "Remodelación de Cocina: Antes y Después",
    excerpt: "Caso de estudio de una remodelación completa de cocina con resultados impresionantes.",
    image: "https://images.unsplash.com/photo-1556912172-45b7abe8b7e4?w=800&h=600&fit=crop",
    author: "Equipo Habita Studio",
    date: "5 Marzo 2024",
    category: "Proyectos",
  },
];

export default function BlogPage() {
  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Blog
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Artículos, consejos y tendencias en diseño de interiores
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((post) => (
            <Card key={post.id} className="group overflow-hidden transition-shadow hover:shadow-lg">
              <div className="relative h-48 w-full overflow-hidden">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                  unoptimized
                />
                <div className="absolute top-4 left-4">
                  <span className="rounded-full bg-primary/90 px-3 py-1 text-xs font-medium text-primary-foreground">
                    {post.category}
                  </span>
                </div>
              </div>
              <CardHeader>
                <h3 className="text-xl font-semibold">{post.title}</h3>
                <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {post.author}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {post.date}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{post.excerpt}</p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link href={`/blog/${post.id}`}>Leer Más</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

