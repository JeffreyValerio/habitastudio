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

// Instante de medianoche de "hoy" en Costa Rica, como Date real (no string) —
// para comparar contra otras fechas (ej. determinar si una fecha de entrega
// ya venció) sin importar la zona horaria del proceso donde corra el código.
export function startOfTodayCR(): Date {
  return new Date(`${todayInCostaRica()}T00:00:00-06:00`);
}

// Suma días a una fecha YYYY-MM-DD usando aritmética de calendario pura
// (ancla en UTC medianoche) para no arrastrar la hora local del navegador,
// que puede empujar el resultado a otro día según a qué hora se ejecute.
export function addDaysToDateString(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}

// Quincenas de longitud fija: 1-14 y 15-29. Los días 30 y 31, cuando el mes
// los tiene, no forman parte de la 2da quincena — se suman a la 1ra
// quincena del mes SIGUIENTE (así el pago de la 2da quincena se puede
// calcular sin esperar a que termine el mes).
export function getPeriodRange(year: number, month: number, quincena?: 1 | 2) {
  const lastDay = new Date(year, month, 0).getDate();

  if (quincena === 1) {
    // Si el mes anterior tuvo día 30 (y/o 31), esos días arrancan esta
    // quincena en vez del día 1.
    const prevMonthLastDay = new Date(year, month - 1, 0).getDate();
    const start =
      prevMonthLastDay >= 30
        ? new Date(year, month - 2, 30, 0, 0, 0)
        : new Date(year, month - 1, 1, 0, 0, 0);
    return {
      start,
      end: new Date(year, month - 1, 14, 23, 59, 59, 999),
    };
  }
  if (quincena === 2) {
    return {
      start: new Date(year, month - 1, 15, 0, 0, 0),
      end: new Date(year, month - 1, Math.min(29, lastDay), 23, 59, 59, 999),
    };
  }
  return {
    start: new Date(year, month - 1, 1, 0, 0, 0),
    end: new Date(year, month - 1, lastDay, 23, 59, 59, 999),
  };
}

// A qué quincena pertenece "hoy" — con el mismo arrastre de 30/31 hacia la
// 1ra quincena del mes siguiente que ya usa getPeriodRange.
export function getCurrentPeriodRange() {
  const today = startOfTodayCR();
  const day = today.getDate();

  if (day <= 14) {
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    return { year, month, quincena: 1 as const, ...getPeriodRange(year, month, 1) };
  }
  if (day <= 29) {
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    return { year, month, quincena: 2 as const, ...getPeriodRange(year, month, 2) };
  }
  // Día 30 o 31: ya pertenece a la 1ra quincena del mes siguiente.
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const year = nextMonth.getFullYear();
  const month = nextMonth.getMonth() + 1;
  return { year, month, quincena: 1 as const, ...getPeriodRange(year, month, 1) };
}

