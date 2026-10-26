import { cn } from "@/lib/utils";

export const DEFAULT_PROCESS_STEPS = [
  { title: "Asesoría", text: "Conversamos sobre tu espacio, tus necesidades y tu presupuesto." },
  { title: "Diseño y cotización", text: "Te presentamos la propuesta con medidas, materiales y precio." },
  { title: "Fabricación", text: "Fabricamos cada pieza a medida con materiales de primera." },
  { title: "Instalación", text: "Entregamos e instalamos en el plazo acordado." },
];

const COMPACT_TEXT = [
  "Tu espacio, necesidades y presupuesto.",
  "Medidas, materiales y precio.",
  "A medida, con materiales de primera.",
  "En el plazo acordado.",
];

export function ProcessSteps({
  steps = DEFAULT_PROCESS_STEPS,
  compact = false,
  className,
}: {
  steps?: { title: string; text: string }[];
  compact?: boolean;
  className?: string;
}) {
  if (compact) {
    return (
      <ol className={cn("flex flex-col gap-5", className)}>
        {steps.map((s, i) => (
          <li key={s.title} className="flex gap-3.5">
            <span className="w-[22px] font-display text-[28px] font-semibold leading-none">
              {i + 1}
            </span>
            <div className="flex flex-col">
              <h3 className="font-semibold">{s.title}</h3>
              <p className="text-sm text-hs-muted">
                {steps === DEFAULT_PROCESS_STEPS ? COMPACT_TEXT[i] : s.text}
              </p>
            </div>
          </li>
        ))}
      </ol>
    );
  }
  return (
    <ol
      className={cn(
        "grid gap-8 sm:grid-cols-2 lg:grid-cols-4",
        className
      )}
    >
      {steps.map((s, i) => (
        <li
          key={s.title}
          className="flex flex-col gap-2.5 border-t-2 border-hs-text pt-5"
        >
          <span className="font-display text-4xl font-semibold leading-none">
            {i + 1}
          </span>
          <h3 className="text-lg font-semibold">{s.title}</h3>
          <p className="text-[15px] text-hs-muted">{s.text}</p>
        </li>
      ))}
    </ol>
  );
}
