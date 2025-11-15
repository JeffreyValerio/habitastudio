import { NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/lib/data/products";
import { getServices } from "@/lib/data/services";
import { getProjects } from "@/lib/data/projects";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q")?.toLowerCase().trim() || "";

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  try {
    const [products, services, projects] = await Promise.all([
      getProducts(),
      getServices(),
      getProjects(),
    ]);

    const results = [];

    // Buscar en productos
    products
      .filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query)
      )
      .slice(0, 3)
      .forEach((product) => {
        results.push({
          type: "product",
          id: product.id,
          title: product.name,
          description: product.description,
          category: product.category,
          image: product.image,
          url: `/catalogo/${product.id}`,
        });
      });

    // Buscar en servicios
    services
      .filter(
        (service) =>
          service.title.toLowerCase().includes(query) ||
          service.description.toLowerCase().includes(query)
      )
      .slice(0, 2)
      .forEach((service) => {
        results.push({
          type: "service",
          id: service.slug,
          title: service.title,
          description: service.description,
          url: `/servicios/${service.slug}`,
        });
      });

    // Buscar en proyectos
    projects
      .filter(
        (project) =>
          project.title.toLowerCase().includes(query) ||
          project.description.toLowerCase().includes(query) ||
          project.category.toLowerCase().includes(query)
      )
      .slice(0, 2)
      .forEach((project) => {
        results.push({
          type: "project",
          id: project.slug,
          title: project.title,
          description: project.description,
          category: project.category,
          image: project.image,
          url: `/proyectos/${project.slug}`,
        });
      });

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}

