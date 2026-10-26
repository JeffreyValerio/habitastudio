// Correr DESPUÉS de desplegar el rediseño (que incluye lib/product-slug-redirects.ts)
// Cambia el slug de los productos según PRODUCT_SLUG_REDIRECTS (SLUG_ANTIGUO -> SLUG_NUEVO),
// única fuente de verdad (versionada en git).
// Uso (prueba, no escribe nada): npx tsx scripts/apply-product-slugs.ts
// Aplicar de verdad (ESCRIBE EN LA BD): npx tsx scripts/apply-product-slugs.ts --apply
// Idempotente: los productos que ya tienen el slug nuevo se cuentan como "ya aplicados".
import "dotenv/config";
import prisma from "../lib/prisma";
import { PRODUCT_SLUG_REDIRECTS } from "../lib/product-slug-redirects";

const APPLY = process.argv.includes("--apply");
const DRY = !APPLY;
console.log(APPLY ? "APLICANDO CAMBIOS EN LA BASE DE DATOS" : "MODO PRUEBA (no se escribe nada). Usa --apply para aplicar.");
const pairs = Object.entries(PRODUCT_SLUG_REDIRECTS).filter(([o, n]) => o !== n);

async function main() {
  const todo: { id: string; from: string; to: string }[] = [];
  let already = 0;
  const problems: string[] = [];
  const newSlugs = new Set(pairs.map(([, n]) => n));
  if (newSlugs.size !== pairs.length) problems.push("Slugs nuevos duplicados en PRODUCT_SLUG_REDIRECTS");

  for (const [from, to] of pairs) {
    const cur = await prisma.product.findUnique({ where: { slug: from } });
    if (!cur) {
      const done = await prisma.product.findUnique({ where: { slug: to } });
      if (done) { already++; continue; }
      problems.push(`"${from}": no existe ni con slug antiguo ni con el nuevo "${to}"`);
      continue;
    }
    const clash = await prisma.product.findUnique({ where: { slug: to } });
    if (clash && clash.id !== cur.id) { problems.push(`"${from}": slug nuevo "${to}" ya pertenece a ${clash.id}`); continue; }
    console.log(`${DRY ? "[dry-run] " : ""}${from} -> ${to}`);
    todo.push({ id: cur.id, from, to });
  }
  console.log(`A cambiar: ${todo.length}, ya aplicados: ${already}, problemas: ${problems.length}`);
  problems.forEach((x) => console.log("PROBLEMA " + x));
  if (problems.length) { console.log("Se rechaza aplicar con problemas."); process.exitCode = 1; return; }
  if (DRY) return;

  await prisma.$transaction(todo.map((p) => prisma.product.update({ where: { id: p.id }, data: { slug: p.to } })));

  let ok = 0;
  for (const [, to] of pairs) {
    const cur = await prisma.product.findUnique({ where: { slug: to } });
    if (cur) ok++;
    else console.log(`NO coincide: ${to}`);
  }
  console.log(`Verificación: ${ok}/${pairs.length} slugs correctos.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
