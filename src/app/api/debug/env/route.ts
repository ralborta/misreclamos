import { NextResponse } from "next/server";

// TEMPORAL: endpoint para verificar variables de entorno
export async function GET() {
  return NextResponse.json({
    hasAppPassword: !!process.env.APP_PASSWORD,
    hasSessionPassword: !!process.env.SESSION_PASSWORD,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    appPasswordLength: process.env.APP_PASSWORD?.length || 0,
    sessionPasswordLength: process.env.SESSION_PASSWORD?.length || 0,
    nodeEnv: process.env.NODE_ENV,
  });
}

