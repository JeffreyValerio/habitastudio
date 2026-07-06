import Image from "next/image";
import { cn } from "@/lib/utils";

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
  "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300",
];

function colorForLabel(label: string) {
  let hash = 0;
  for (let i = 0; i < label.length; i++) hash = label.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function InitialsAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <div
      className={cn(
        "h-11 w-11 shrink-0 rounded-full flex items-center justify-center text-sm font-semibold",
        colorForLabel(name || "?"),
        className
      )}
    >
      {getInitials(name || "?")}
    </div>
  );
}

export function ImageAvatar({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <div className={cn("relative h-11 w-11 shrink-0 rounded-full overflow-hidden bg-muted", className)}>
      <Image src={src} alt={alt} fill className="object-cover" unoptimized />
    </div>
  );
}

// Fila compacta para listar registros en mobile: avatar + título/subtítulo a la
// izquierda, valor destacado y acciones apiladas a la derecha. Reemplaza a la
// tabla (que solo se muestra desde md) en pantallas angostas.
export function MobileListItem({
  avatar,
  title,
  subtitle,
  value,
  valueClassName,
  actions,
}: {
  avatar: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  value?: React.ReactNode;
  valueClassName?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 p-3 border-b last:border-b-0 hover:bg-accent/50 transition-colors">
      {avatar}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{title}</p>
        {subtitle && <div className="text-xs text-muted-foreground truncate mt-0.5">{subtitle}</div>}
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        {value && <div className={cn("text-sm font-semibold whitespace-nowrap", valueClassName)}>{value}</div>}
        {actions && <div className="flex items-center gap-0.5">{actions}</div>}
      </div>
    </div>
  );
}
