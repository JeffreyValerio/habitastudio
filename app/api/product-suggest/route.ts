import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getSectionAccess } from "@/app/actions/role-permissions";
import prisma from "@/lib/prisma";

const openai = new OpenAI({ apiKey: process.env.API_KEY_OPENAI });

const SYSTEM = `Eres un copywriter experto en e-commerce de mobiliario y remodelación en Costa Rica.
La tienda es Habita Studio (San José, Costa Rica): diseña y fabrica muebles a medida (closets, puertas, cocinas, mobiliario para hogar y oficina) y ofrece servicios de remodelación.
El público busca calidad, diseño y fabricación a medida, no muebles genéricos de bodega.

REGLA ESTRICTA DE NO INVENCIÓN:
- Usa ÚNICAMENTE los datos del producto que se te entregan en el mensaje.
- Nunca inventes materiales, medidas, colores, acabados, iluminación, herrajes, garantía ni tiempos de entrega.
- Si un dato no fue proporcionado, no lo menciones ni lo insinúes.
- El único dato de servicio que puedes afirmar sin que se te dé es que Habita Studio fabrica a medida.

Escribe en español tal como se usa en Costa Rica, con tono profesional pero cercano.
Responde ÚNICAMENTE con el texto solicitado, sin explicaciones, sin comillas, sin formato extra.`;

type Ctx = {
  name: string;
  category: string;
  material: string;
  dimensions: string;
  color: string;
  warranty: string;
  features: string;
  description: string;
};

function dataBlock(c: Ctx) {
  const lines = [
    c.name && `- Nombre actual: ${c.name}`,
    c.category && `- Categoría: ${c.category}`,
    c.material && `- Material: ${c.material}`,
    c.dimensions && `- Dimensiones: ${c.dimensions}`,
    c.color && `- Colores: ${c.color}`,
    c.warranty && `- Garantía: ${c.warranty}`,
    c.features && `- Características actuales: ${c.features.replace(/\n+/g, "; ")}`,
    c.description && `- Descripción actual: ${c.description}`,
  ].filter(Boolean);
  return `DATOS REALES DEL PRODUCTO (única fuente permitida):\n${lines.join("\n")}`;
}

const PROMPTS = {
  name: (c: Ctx, others: string[]) =>
    `Escribe un nombre de producto para el catálogo.

${dataBlock(c)}

Reglas:
- Máximo 45 caracteres (el título de la página será "<nombre> | Habita Studio")
- Patrón: [tipo de mueble] + [rasgo distintivo real], usando solo los datos de arriba
- Ejemplo de estructura (no copies sus rasgos, usa solo los reales): "Closet de melamina con puertas corredizas"
- NUNCA devuelvas un nombre genérico que sea solo el tipo de mueble (ej: "Closet", "Puerta principal", "Mueble de cocina", "Escritorio"). Siempre añade al menos un rasgo distintivo REAL de los datos: material, color/acabado, configuración (número de puertas o gavetas, tipo de apertura), estilo, o uso/espacio
- Si los datos no tienen ningún rasgo distintivo, usa el espacio o uso que aparezca en la descripción o la categoría (ej: "Closet para dormitorio principal"), sin inventar características físicas
- Mayúscula solo en la primera letra y nombres propios; el resto en minúscula
- Sin marca, sin precio, sin ubicación, sin símbolos
- Que suene natural, como lo buscaría un cliente real
${
  others.length
    ? `- Debe ser distinto a los nombres de otros productos existentes: ${others.join(" | ")}`
    : ""
}`,

  description: (c: Ctx) =>
    `Escribe la descripción de este producto para la ficha del catálogo${
      c.description ? " (mejora la actual sin perder datos reales)" : " (no hay descripción previa, créala desde cero)"
    }.

${dataBlock(c)}

Reglas:
- Texto plano: la primera oración, de máximo 155 caracteres, debe funcionar sola como meta description: tipo de mueble + rasgo principal real + "a medida" y, de forma natural, Costa Rica o San José
- Luego 1 o 2 párrafos cortos; total entre 80 y 120 palabras
- Cubre uso/espacio, materiales o acabados solo si fueron dados, que se fabrica a medida por Habita Studio, y cierra con una invitación suave a solicitar una cotización
- Palabras clave naturales, sin repetirlas en exceso
- Sin listas, sin markdown, sin emojis`,

  features: (c: Ctx) =>
    `Genera una lista de características para este producto, una por línea.

${dataBlock(c)}

Reglas:
- Entre 3 y 6 líneas
- Cada línea: característica breve y concreta, máximo 8 palabras
- Usa solo los datos de arriba; puedes añadir "Fabricación a medida" como único dato de servicio genérico
- Sin viñetas, guiones ni numeración al inicio; sin punto final
- No repitas la misma idea en dos líneas`,
};

const clean = (v: unknown, max = 500) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

function stripQuotes(s: string) {
  return s.replace(/^[\s"'“”«»‘’`]+|[\s"'“”«»‘’`]+$/g, "").trim();
}

const GENERIC_WORDS = new Set([
  "closet","puerta","puertas","mueble","muebles","cocina","escritorio","mesa","silla","repisa","principal","de","para","la","el","un","una",
]);
const norm = (v: string) =>
  v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

function isGenericName(name: string, category: string) {
  const n = norm(name);
  if (!n) return true;
  const words = n.split(" ");
  if (words.length === 1) return true;
  if (n === norm(category)) return true;
  return words.length <= 3 && words.every((w) => GENERIC_WORDS.has(w));
}

export async function POST(req: NextRequest) {
  const { allowed } = await getSectionAccess("admin.products");
  if (!allowed) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const field = body.field;

    if (field !== "name" && field !== "description" && field !== "features") {
      return NextResponse.json({ error: "Campo inválido" }, { status: 400 });
    }

    const ctx: Ctx = {
      name: clean(body.name),
      category: clean(body.category),
      material: clean(body.material),
      dimensions: clean(body.dimensions),
      color: clean(body.color),
      warranty: clean(body.warranty),
      features: clean(body.features, 1000),
      description: clean(body.description, 2000),
    };
    // Compatibilidad: `text` es el valor actual del campo que se mejora.
    const text = clean(body.text, field === "description" ? 2000 : 1000);
    if (field === "name" && !ctx.name) ctx.name = text.slice(0, 500);
    const productId = clean(body.productId, 100);

    if (!ctx.name) {
      return NextResponse.json(
        { error: "Escribe primero el nombre del producto" },
        { status: 400 }
      );
    }

    let userPrompt: string;
    if (field === "name") {
      const others = await prisma.product.findMany({
        where: productId ? { id: { not: productId } } : undefined,
        select: { name: true },
        orderBy: { name: "asc" },
        take: 200,
      });
      userPrompt = PROMPTS.name(
        ctx,
        others.map((p) => p.name)
      );
    } else if (field === "description") {
      userPrompt = PROMPTS.description(ctx);
    } else {
      userPrompt = PROMPTS.features(ctx);
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: userPrompt },
      ],
      max_tokens: field === "description" ? 400 : field === "features" ? 160 : 60,
      temperature: field === "description" ? 0.6 : 0.4,
    });

    const finish = (raw: string) => {
      let r = stripQuotes(raw);
      if (field === "name") r = r.replace(/\.+$/, "").trim();
      return r;
    };
    let result = finish(completion.choices[0]?.message?.content ?? "");
    let warning: string | undefined;

    if (field === "name" && isGenericName(result, ctx.category)) {
      const retry = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: `${userPrompt}\n\nEl nombre anterior ("${result}") es demasiado genérico. Genera otro que incluya al menos un rasgo distintivo real (material, color, configuración, uso o espacio) tomado de los datos.`,
          },
        ],
        max_tokens: 60,
        temperature: 0.4,
      });
      result = finish(retry.choices[0]?.message?.content ?? "") || result;
      if (isGenericName(result, ctx.category)) {
        warning = "Nombre muy genérico: agrega material, color o medidas al producto";
      }
    }

    return NextResponse.json({ result, ...(warning ? { warning } : {}) });
  } catch (err) {
    console.error("Product suggest error:", err);
    return NextResponse.json({ error: "Error al generar sugerencia" }, { status: 500 });
  }
}
