"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { SiteButton } from "@/components/site/site-button";
import { cn } from "@/lib/utils";
import { trackLead } from "@/lib/analytics";

export const SUBJECT_OPTIONS = [
  "Cotización de mueble a medida",
  "Closets y organización",
  "Remodelación",
  "Diseño de interiores",
  "Otro",
] as const;

type SubjectOption = (typeof SUBJECT_OPTIONS)[number];

function phoneDigits(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.length > 8 && digits.startsWith("506")) digits = digits.slice(3);
  return digits;
}

const contactFormSchema = z.object({
  name: z.string().trim().min(2, "Ingresa tu nombre (mínimo 2 caracteres)."),
  email: z.string().trim().email("Ingresa un correo válido."),
  phone: z
    .string()
    .refine((v) => phoneDigits(v).length >= 8, "Ingresa un teléfono de al menos 8 dígitos."),
  subject: z.enum(SUBJECT_OPTIONS, { message: "Selecciona un asunto." }),
  message: z.string().trim().min(10, "El mensaje debe tener al menos 10 caracteres."),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

const MAX_PARAM = 120;

function cleanParam(value: string | null): string {
  if (!value) return "";
  return value.replace(/[\r\n\t]+/g, " ").replace(/[«»<>]/g, "").trim().slice(0, MAX_PARAM);
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function mapSubject(asunto: string, producto: string): SubjectOption {
  const a = normalize(asunto);
  if (producto || /cotiz|mueble|carpinter|medida/.test(a)) return SUBJECT_OPTIONS[0];
  if (/closet|vestidor|armario/.test(a)) return SUBJECT_OPTIONS[1];
  if (/remodel|cocina|bano|piso|pintura|drywall|techo|cielo|iluminacion|led/.test(a))
    return SUBJECT_OPTIONS[2];
  if (/diseno|interior/.test(a)) return SUBJECT_OPTIONS[3];
  return SUBJECT_OPTIONS[4];
}

const FIELD =
  "min-h-[48px] w-full rounded-none border border-hs-input bg-white px-3.5 font-sans text-[15px] font-normal text-hs-text placeholder:text-hs-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-hs-accent aria-[invalid=true]:border-red-700";
const LABEL = "flex flex-col gap-1.5 text-sm font-medium text-hs-text";
const ERROR = "text-[13px] font-normal text-red-700";

export function ContactForm() {
  const searchParams = useSearchParams();
  const asunto = cleanParam(searchParams.get("asunto"));
  const producto = cleanParam(searchParams.get("producto"));
  const detail = producto || asunto;
  const hasParams = Boolean(detail);

  const initialSubject = hasParams ? mapSubject(asunto, producto) : undefined;
  const initialMessage = !hasParams
    ? ""
    : producto
      ? `Hola, me interesa el modelo «${producto}».`
      : `Hola, me interesa el servicio «${asunto}».`;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: initialSubject,
      message: initialMessage,
    },
  });

  const onSubmit = async (data: ContactFormValues) => {
    setIsSubmitting(true);
    setStatus("idle");

    const payload = {
      ...data,
      subject: detail ? `${data.subject} — ${detail}` : data.subject,
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al enviar el mensaje");
      }

      // Only non-personal data: subject option and prefilled product/service.
      trackLead({
        subject: data.subject,
        ...(producto ? { product: producto } : asunto ? { service: asunto } : {}),
      });
      setStatus("success");
      reset({ name: "", email: "", phone: "", subject: undefined, message: "" });
    } catch (error) {
      console.error("Error submitting form:", error);
      setErrorMessage(
        error instanceof Error && error.message
          ? error.message
          : "No pudimos enviar tu mensaje. Intenta nuevamente."
      );
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      {status === "success" && (
        <div
          role="status"
          className="border border-hs-border bg-hs-successBg px-5 py-4 text-[15px] text-hs-text"
        >
          Gracias. Recibimos tu mensaje y te contactaremos en horario de oficina.
        </div>
      )}
      {status === "error" && (
        <div
          role="alert"
          className="border border-red-700 bg-white px-5 py-4 text-[15px] text-red-700"
        >
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <label htmlFor="name" className={LABEL}>
          Nombre completo *
          <input
            id="name"
            type="text"
            autoComplete="name"
            className={FIELD}
            aria-invalid={errors.name ? "true" : "false"}
            aria-describedby={errors.name ? "name-error" : undefined}
            {...register("name")}
          />
          {errors.name && (
            <span id="name-error" className={ERROR}>
              {errors.name.message}
            </span>
          )}
        </label>

        <label htmlFor="phone" className={LABEL}>
          Teléfono *
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+506"
            className={FIELD}
            aria-invalid={errors.phone ? "true" : "false"}
            aria-describedby={errors.phone ? "phone-error" : undefined}
            {...register("phone")}
          />
          {errors.phone && (
            <span id="phone-error" className={ERROR}>
              {errors.phone.message}
            </span>
          )}
        </label>

        <label htmlFor="email" className={LABEL}>
          Correo electrónico *
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={FIELD}
            aria-invalid={errors.email ? "true" : "false"}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
          {errors.email && (
            <span id="email-error" className={ERROR}>
              {errors.email.message}
            </span>
          )}
        </label>

        <label htmlFor="subject" className={LABEL}>
          Asunto *
          <select
            id="subject"
            defaultValue=""
            className={cn(FIELD, "pr-8")}
            aria-invalid={errors.subject ? "true" : "false"}
            aria-describedby={errors.subject ? "subject-error" : undefined}
            {...register("subject")}
          >
            <option value="" disabled>
              Selecciona un asunto
            </option>
            {SUBJECT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors.subject && (
            <span id="subject-error" className={ERROR}>
              {errors.subject.message}
            </span>
          )}
        </label>
      </div>

      <label htmlFor="message" className={LABEL}>
        Mensaje *
        <textarea
          id="message"
          rows={6}
          placeholder="Cuéntanos qué necesitas, medidas aproximadas y ubicación."
          className={cn(FIELD, "resize-y py-3")}
          aria-invalid={errors.message ? "true" : "false"}
          aria-describedby={errors.message ? "message-error" : undefined}
          {...register("message")}
        />
        {errors.message && (
          <span id="message-error" className={ERROR}>
            {errors.message.message}
          </span>
        )}
      </label>

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className="text-[13px] text-hs-muted">
          Al enviar aceptas nuestra{" "}
          <Link
            href="/politica-privacidad"
            className="underline underline-offset-2 hover:text-hs-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hs-accent"
          >
            política de privacidad
          </Link>
          .
        </p>
        <SiteButton type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? "Enviando…" : "Enviar mensaje"}
        </SiteButton>
      </div>
    </form>
  );
}
