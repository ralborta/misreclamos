import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { prisma } from "@/lib/db";
import { sessionOptions, type SessionData } from "@/lib/auth";
import type { Prisma } from "@prisma/client";
import * as XLSX from "xlsx";

const PHONE_KEYS = ["Telefono", "telefono", "Phone", "Teléfono", "tel", "Tel"];

function normalizePhone(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") {
    if (Number.isNaN(value)) return null;
    return String(Math.round(value));
  }
  const s = String(value).trim();
  if (!s) return null;
  const digits = s.replace(/\D/g, "");
  return digits.length > 0 ? digits : null;
}

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

export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
      return NextResponse.json({ error: "El archivo debe ser Excel (.xlsx o .xls)" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      raw: true,
      defval: null,
    });

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "El Excel no tiene filas de datos" }, { status: 400 });
    }

    const sourceName = file.name;
    let inserted = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      try {
        const data = normalizeRow(rows[i]) as Prisma.InputJsonValue;
        await prisma.legado.create({
          data: { data, source: sourceName },
        });
        inserted++;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`Fila ${i + 2}: ${msg}`);
      }
    }

    return NextResponse.json({
      ok: true,
      inserted,
      errors,
      total: rows.length,
      message: `Importados ${inserted} de ${rows.length} registros${errors.length ? ` (${errors.length} errores)` : ""}.`,
    });
  } catch (error) {
    console.error("Error al importar legado:", error);
    return NextResponse.json(
      {
        error: "Error al procesar el archivo Excel",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
