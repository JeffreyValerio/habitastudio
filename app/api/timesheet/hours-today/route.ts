import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json(
      { error: "userId requerido" },
      { status: 400 }
    );
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const entries = await prisma.timeEntry.findMany({
      where: {
        userId,
        entryDate: {
          gte: today,
          lt: tomorrow,
        },
        exitTime: { not: null },
      },
    });

    let totalHours = 0;
    entries.forEach((entry) => {
      if (entry.exitTime) {
        const diff = entry.exitTime.getTime() - entry.entryTime.getTime();
        totalHours += diff / (1000 * 60 * 60);
      }
    });

    return NextResponse.json({
      hours: parseFloat(totalHours.toFixed(2)),
      entries: entries.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error obteniendo horas" },
      { status: 500 }
    );
  }
}
