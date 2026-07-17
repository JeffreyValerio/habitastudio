import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCRC(amount: number, decimals = 2): string {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

// Fecha de "hoy" en formato YYYY-MM-DD según el calendario de Costa Rica.
// `new Date().toISOString()` da la fecha UTC: después de las 6pm hora CR
// (medianoche UTC) ya muestra el día siguiente aunque en Costa Rica siga
// siendo hoy. Se usa para valores por defecto de inputs de fecha.
export function todayInCostaRica(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Costa_Rica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

// Suma días a una fecha YYYY-MM-DD usando aritmética de calendario pura
// (ancla en UTC medianoche) para no arrastrar la hora local del navegador,
// que puede empujar el resultado a otro día según a qué hora se ejecute.
export function addDaysToDateString(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}

