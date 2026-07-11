import { NextResponse } from "next/server";

import { getPrismaClient } from "@/infrastructure/database/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await getPrismaClient().$queryRaw`SELECT 1`;
    return NextResponse.json(
      { status: "healthy", checks: { database: { status: "up" } } },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { status: "unhealthy", checks: { database: { status: "down" } } },
      { status: 503 }
    );
  }
}
