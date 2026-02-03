#!/usr/bin/env tsx
/**
 * Carga registros desde un Excel a la tabla Legado.
 * Uso: pnpm exec tsx scripts/import-legado.ts <ruta-al-archivo.xlsx>
 * Ejemplo: pnpm exec tsx scripts/import-legado.ts ./descargas/reclamos-legado.xlsx
 *
 * Requiere: DATABASE_URL en .env (o variable de entorno)
 * Opcional: LEGADO_SOURCE para guardar un nombre de origen (ej: "reclamos-2024.xlsx")
 */

import "dotenv/config";
import { PrismaClient, type Prisma } from "@prisma/client";
import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function main() {
  const excelPath = process.argv[2] || process.env.LEGADO_EXCEL;
  const sourceName =
    process.env.LEGADO_SOURCE || (excelPath ? path.basename(excelPath) : null);

  if (!excelPath?.trim()) {
    console.error("Uso: pnpm exec tsx scripts/import-legado.ts <archivo.xlsx>");
    console.error("  o definir LEGADO_EXCEL con la ruta del archivo.");
    process.exit(1);
  }

  const resolvedPath = path.resolve(process.cwd(), excelPath);
  if (!fs.existsSync(resolvedPath)) {
    console.error("No se encontró el archivo:", resolvedPath);
    process.exit(1);
  }

  console.log("Conectando a la base de datos...");
  await prisma.$connect();

  console.log("Leyendo Excel:", resolvedPath);
  const buf = fs.readFileSync(resolvedPath);
  const workbook = XLSX.read(buf, { type: "buffer" });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    raw: true,
    defval: null,
  });

  if (rows.length === 0) {
    console.log("El archivo no tiene filas de datos. Nada que importar.");
    await prisma.$disconnect();
    return;
  }

  console.log(`Encontradas ${rows.length} filas. Insertando en tabla Legado...`);

  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < rows.length; i++) {
    try {
      const row = rows[i];
      const data = normalizeRow(row);
      await prisma.legado.create({
        data: {
          data: data as Prisma.InputJsonValue,
          source: sourceName,
        },
      });
      inserted++;
      if ((i + 1) % 100 === 0) console.log(`  ${i + 1}/${rows.length}...`);
    } catch (e: unknown) {
      errors++;
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`Fila ${i + 2}: ${msg}`);
    }
  }

  await prisma.$disconnect();
  console.log("\nListo.");
  console.log(`  Insertados: ${inserted}`);
  if (errors) console.log(`  Errores: ${errors}`);
}

const PHONE_KEYS = ["Telefono", "telefono", "Phone", "Teléfono", "tel", "Tel"];

function normalizeRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (v === undefined) continue;
    const key = (k || "").trim() || "col";
    const isPhone = PHONE_KEYS.some((p) => key.toLowerCase() === p.toLowerCase());
    out[key] = isPhone ? normalizePhone(v) : v;
  }
  return out;
}

/**
 * Arregla teléfono: notación científica (5,49364E+12) → string de dígitos "5493640000000".
 * También limpia espacios, guiones y deja solo números.
 */
function normalizePhone(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") {
    if (Number.isNaN(value)) return null;
    const asInt = Math.round(value);
    return String(asInt);
  }
  const s = String(value).trim();
  if (!s) return null;
  const digits = s.replace(/\D/g, "");
  return digits.length > 0 ? digits : null;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
