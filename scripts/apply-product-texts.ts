// Aplica name, description y features propuestos (NO toca el slug).
// Uso (prueba, no escribe nada): npx tsx scripts/apply-product-texts.ts
// Aplicar de verdad (ESCRIBE EN LA BD): npx tsx scripts/apply-product-texts.ts --apply
// Idempotente: si el producto ya tiene los textos propuestos, no cambia nada.
import "dotenv/config";
import { readFileSync } from "fs";
import prisma from "../lib/prisma";

const APPLY = process.argv.includes("--apply");
const DRY = !APPLY;
console.log(APPLY ? "APLICANDO CAMBIOS EN LA BASE DE DATOS" : "MODO PRUEBA (no se escribe nada). Usa --apply para aplicar.");
const backup: { id: string; name: string }[] = JSON.parse(
  readFileSync("backups/products-2026-10-26.json", "utf8")
);
const proposal: {
  id: string;
  proposedName: string;
  proposedDescription: string;
  proposedFeatures: string[];
}[] = JSON.parse(readFileSync("backups/products-proposal-2026-10-26.json", "utf8"));

const same = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

async function main() {
  const todo: typeof proposal = [];
  let skipped = 0;
  let already = 0;
  for (const p of proposal) {
    const cur = await prisma.product.findUnique({ where: { id: p.id } });
    const bk = backup.find((b) => b.id === p.id);
    if (!cur) { console.log(`SKIP ${p.id}: no existe`); skipped++; continue; }
    const alreadyDone =
      cur.name === p.proposedName && cur.description === p.proposedDescription && same(cur.features, p.proposedFeatures);
    if (alreadyDone) { already++; continue; }
    if (!bk || cur.name !== bk.name) {
      console.log(`SKIP ${p.id}: nombre actual "${cur.name}" difiere del backup "${bk?.name}"`);
      skipped++;
      continue;
    }
    console.log(`${DRY ? "[dry-run] " : ""}UPDATE ${cur.slug}: "${cur.name}" -> "${p.proposedName}" (${p.proposedFeatures.length} features)`);
    todo.push(p);
  }
  console.log(`A actualizar: ${todo.length}, ya aplicados: ${already}, omitidos: ${skipped}`);
  if (DRY) return;

  if (todo.length) {
    await prisma.$transaction(
      todo.map((p) =>
        prisma.product.update({
          where: { id: p.id },
          data: { name: p.proposedName, description: p.proposedDescription, features: p.proposedFeatures },
        })
      )
    );
  }

  let ok = 0;
  const bad: string[] = [];
  for (const p of proposal) {
    const cur = await prisma.product.findUnique({ where: { id: p.id } });
    if (cur && cur.name === p.proposedName && cur.description === p.proposedDescription && same(cur.features, p.proposedFeatures)) ok++;
    else bad.push(p.id);
  }
  console.log(`Verificación: ${ok}/${proposal.length} coinciden con la propuesta.${bad.length ? " NO coinciden: " + bad.join(", ") : ""}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
