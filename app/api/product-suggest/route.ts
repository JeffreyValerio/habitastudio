import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getSectionAccess } from "@/app/actions/role-permissions";

const openai = new OpenAI({ apiKey: process.env.API_KEY_OPENAI });

const SYSTEM = `Eres un copywriter experto en e-commerce de mobiliario y remodelación en Costa Rica.
La tienda es Habita Studio: diseña y fabrica muebles a medida (closets, puertas, cocinas, mobiliario para hogar y oficina) y ofrece servicios de remodelación.
El público busca calidad, diseño y fabricación a medida, no muebles genéricos de bodega.
Siempre responde ÚNICAMENTE con el texto solicitado, sin explicaciones, sin comillas, sin formato extra.`;

const PROMPTS = {
  name: (text: string, category?: string) =>
    `Reescribe este nombre de producto para el catálogo, de forma clara y atractiva.

Reglas:
- Máximo 60 caracteres
- Incluye el tipo de mueble y su característica principal (material, acabado o función)
- Patrón ideal: [Tipo de mueble] + [Característica distintiva] (ej: "Closet Modular con Iluminación LED")
${category ? `- La categoría del producto es: ${category}` : ""}
- Sin mayúsculas innecesarias, sin símbolos, sin precio ni marca al final
- Que suene natural, como lo buscaría un cliente real

Nombre actual: ${text}`,

  description: (text: string, category?: string) =>
    `Reescribe esta descripción de producto para la ficha del catálogo.

Reglas:
- Entre 2 y 4 oraciones fluidas
- Destaca fabricación a medida, materiales y/o acabados si aplica
- Incluye palabras clave naturales: tipo de mueble, uso, estilo
${category ? `- La categoría del producto es: ${category}` : ""}
- Tono profesional pero cercano, como si le hablaras a alguien remodelando su hogar u oficina
- Sin listas, sin markdown, sin emojis, texto fluido en español

Descripción actual: ${text}`,

  features: (text: string, category?: string, name?: string) =>
    `Genera una lista de características para este producto de catálogo, una por línea.

Reglas:
- Entre 3 y 6 líneas
- Cada línea es una característica breve y concreta (máximo 8 palabras)
- Sin viñetas, guiones ni numeración al inicio de cada línea
- Sin punto final en cada línea
- Menciona materiales, acabados, medidas o funciones si son relevantes
${name ? `- Nombre del producto: ${name}` : ""}
${category ? `- Categoría del producto: ${category}` : ""}
${
  text?.trim()
    ? `- Conserva o mejora estas características existentes en vez de ignorarlas: ${text}`
    : "- No hay características previas, genera desde cero según el nombre y la categoría"
}`,
};

export async function POST(req: NextRequest) {
  const { allowed } = await getSectionAccess("admin.products");
  if (!allowed) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const { text, field, category, name } = (await req.json()) as {
      text?: string;
      field: "name" | "description" | "features";
      category?: string;
      name?: string;
    };

    if (!["name", "description", "features"].includes(field)) {
      return NextResponse.json({ error: "Campo inválido" }, { status: 400 });
    }
    if (field === "features") {
      if (!name?.trim() && !text?.trim()) {
        return NextResponse.json(
          { error: "Escribe primero el nombre del producto" },
          { status: 400 }
        );
      }
    } else if (!text?.trim()) {
      return NextResponse.json({ error: "El texto es requerido" }, { status: 400 });
    }

    const userPrompt =
      field === "features"
        ? PROMPTS.features(text || "", category, name)
        : PROMPTS[field](text || "", category);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: userPrompt },
      ],
      max_tokens: field === "description" ? 220 : field === "features" ? 160 : 60,
      temperature: 0.7,
    });

    const result = completion.choices[0]?.message?.content?.trim() ?? "";

    return NextResponse.json({ result });
  } catch (err) {
    console.error("Product suggest error:", err);
    return NextResponse.json({ error: "Error al generar sugerencia" }, { status: 500 });
  }
}
