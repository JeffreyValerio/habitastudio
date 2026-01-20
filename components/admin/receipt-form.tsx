"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createUpdateReceipt, getReceipt, getReceiptsByQuote } from "@/app/actions/receipts";
import { getQuotes } from "@/app/actions/quotes";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const receiptFormSchema = z.object({
  quoteId: z.string().min(1, "Debe seleccionar una cotización"),
  clientName: z.string().min(1, "El nombre del cliente es requerido"),
  clientEmail: z
    .preprocess(
      (val) => {
        if (val === null || val === "" || val === undefined) return undefined;
        return val;
      },
      z.string().email("Email inválido").optional()
    ),
  amount: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "El monto debe ser mayor a 0"),
  paymentMethod: z.enum(["efectivo", "transferencia", "sinpe", "cheque", "otro"]),
  receiptDate: z.string().min(1, "La fecha del recibo es requerida"),
  concept: z.string().min(1, "El concepto es requerido"),
  notes: z.string().optional(),
});

type ReceiptFormData = z.infer<typeof receiptFormSchema>;

interface Quote {
  id: string;
  quoteNumber: string;
  clientName: string;
  clientEmail?: string | null;
  total: number;
}

interface Receipt {
  id: string;
  receiptNumber: string;
  quoteId: string;
  clientName: string;
  clientEmail?: string | null;
  amount: number;
  paymentMethod: string;
  receiptDate: Date;
  concept: string;
  notes?: string | null;
}

interface ReceiptFormProps {
  receipt?: Receipt;
}

export function ReceiptForm({ receipt }: ReceiptFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(true);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>(
    receipt?.quoteId || ""
  );
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [existingReceipts, setExistingReceipts] = useState<any[]>([]);
  const [loadingReceipts, setLoadingReceipts] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ReceiptFormData>({
    resolver: zodResolver(receiptFormSchema),
    defaultValues: {
      quoteId: receipt?.quoteId || "",
      clientName: receipt?.clientName || "",
      clientEmail: receipt?.clientEmail || "",
      amount: receipt?.amount.toString() || "",
      paymentMethod: (receipt?.paymentMethod as "efectivo" | "transferencia" | "sinpe" | "cheque" | "otro") || "efectivo",
      receiptDate: receipt
        ? new Date(receipt.receiptDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      concept: receipt?.concept || "",
      notes: receipt?.notes || "",
    },
  });

  const amount = watch("amount");

  // Cargar cotizaciones
  useEffect(() => {
    async function loadQuotes() {
      try {
        const quotesData = await getQuotes();
        setQuotes(quotesData);
        
        // Si hay un recibo, encontrar la cotización correspondiente
        if (receipt) {
          const quote = quotesData.find((q) => q.id === receipt.quoteId);
          if (quote) {
            setSelectedQuote(quote);
            setSelectedQuoteId(quote.id);
            setValue("clientName", quote.clientName);
            setValue("clientEmail", quote.clientEmail || "");
          }
        }
      } catch (error) {
        console.error("Error al cargar cotizaciones:", error);
        toast({
          title: "Error",
          description: "Error al cargar las cotizaciones",
          variant: "destructive",
        });
      } finally {
        setLoadingQuotes(false);
      }
    }
    loadQuotes();
  }, [receipt, setValue, toast]);

  // Cargar recibos existentes cuando se selecciona una cotización
  useEffect(() => {
    if (selectedQuoteId && selectedQuoteId !== receipt?.quoteId) {
      setLoadingReceipts(true);
      getReceiptsByQuote(selectedQuoteId)
        .then((receipts) => {
          setExistingReceipts(receipts);
        })
        .catch((error) => {
          console.error("Error al cargar recibos:", error);
        })
        .finally(() => {
          setLoadingReceipts(false);
        });
    } else if (receipt?.quoteId) {
      // Si estamos editando, cargar recibos excluyendo el actual
      getReceiptsByQuote(receipt.quoteId)
        .then((receipts) => {
          setExistingReceipts(receipts.filter((r) => r.id !== receipt.id));
        })
        .catch((error) => {
          console.error("Error al cargar recibos:", error);
        });
    }
  }, [selectedQuoteId, receipt]);

  const handleQuoteChange = (quoteId: string) => {
    setSelectedQuoteId(quoteId);
    setValue("quoteId", quoteId);
    
    const quote = quotes.find((q) => q.id === quoteId);
    if (quote) {
      setSelectedQuote(quote);
      setValue("clientName", quote.clientName);
      setValue("clientEmail", quote.clientEmail || "");
    }
  };

  // Calcular saldo disponible
  const calculateAvailableAmount = () => {
    if (!selectedQuote) return 0;
    
    const totalPaid = existingReceipts.reduce((sum, r) => sum + r.amount, 0);
    return selectedQuote.total - totalPaid;
  };

  const availableAmount = calculateAvailableAmount();
  const amountNum = parseFloat(amount || "0");

  const onSubmit = async (data: ReceiptFormData) => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      if (receipt?.id) {
        formData.append("id", receipt.id);
      }
      formData.append("quoteId", data.quoteId);
      formData.append("clientName", data.clientName);
      if (data.clientEmail) {
        formData.append("clientEmail", data.clientEmail);
      }
      formData.append("amount", data.amount);
      formData.append("paymentMethod", data.paymentMethod);
      formData.append("receiptDate", data.receiptDate);
      formData.append("concept", data.concept);
      if (data.notes) {
        formData.append("notes", data.notes);
      }

      const result = await createUpdateReceipt(formData);

      if (result.ok) {
        toast({
          title: "Éxito",
          description: result.message,
        });
        router.push("/admin/receipts");
      } else {
        toast({
          title: "Error",
          description: result.message || "Error al guardar el recibo",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al guardar el recibo",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCRC = (value: number) =>
    `₡${new Intl.NumberFormat("es-CR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)}`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="quoteId">Cotización *</Label>
          {loadingQuotes ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Cargando cotizaciones...</span>
            </div>
          ) : (
            <Select
              value={selectedQuoteId}
              onValueChange={handleQuoteChange}
              disabled={!!receipt}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione una cotización" />
              </SelectTrigger>
              <SelectContent>
                {quotes.map((quote) => (
                  <SelectItem key={quote.id} value={quote.id}>
                    {quote.quoteNumber} - {quote.clientName} ({formatCRC(quote.total)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <input type="hidden" {...register("quoteId")} />
          {errors.quoteId && (
            <p className="text-sm text-destructive">{errors.quoteId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="receiptDate">Fecha del Recibo *</Label>
          <Input
            id="receiptDate"
            type="date"
            {...register("receiptDate")}
          />
          {errors.receiptDate && (
            <p className="text-sm text-destructive">{errors.receiptDate.message}</p>
          )}
        </div>
      </div>

      {selectedQuote && (
        <div className="bg-muted/50 p-4 rounded-lg space-y-2">
          <h3 className="font-semibold">Información de la Cotización</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Número:</span>{" "}
              <span className="font-medium">{selectedQuote.quoteNumber}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total:</span>{" "}
              <span className="font-medium">{formatCRC(selectedQuote.total)}</span>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Total pagado:</span>{" "}
              <span className="font-medium">
                {formatCRC(
                  existingReceipts.reduce((sum, r) => sum + r.amount, 0)
                )}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Saldo disponible:</span>{" "}
              <span className="font-medium text-green-600">
                {formatCRC(availableAmount)}
              </span>
            </div>
          </div>
          {existingReceipts.length > 0 && (
            <div className="mt-2 pt-2 border-t">
              <p className="text-sm font-semibold mb-1">Recibos existentes:</p>
              <ul className="text-sm space-y-1">
                {existingReceipts.map((r) => (
                  <li key={r.id}>
                    {r.receiptNumber} - {formatCRC(r.amount)} ({new Date(r.receiptDate).toLocaleDateString("es-CR")})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="clientName">Nombre del Cliente *</Label>
          <Input
            id="clientName"
            {...register("clientName")}
            placeholder="Juan Pérez"
          />
          {errors.clientName && (
            <p className="text-sm text-destructive">{errors.clientName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="clientEmail">Email del Cliente (opcional)</Label>
          <Input
            id="clientEmail"
            type="email"
            {...register("clientEmail")}
            placeholder="cliente@ejemplo.com"
          />
          {errors.clientEmail && (
            <p className="text-sm text-destructive">{errors.clientEmail.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Monto *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            {...register("amount")}
            placeholder="0.00"
          />
          {errors.amount && (
            <p className="text-sm text-destructive">{errors.amount.message}</p>
          )}
          {selectedQuote && amountNum > 0 && (
            <p className={`text-sm ${amountNum > availableAmount ? "text-destructive" : "text-muted-foreground"}`}>
              {amountNum > availableAmount
                ? `El monto no puede ser mayor al disponible (${formatCRC(availableAmount)})`
                : `Monto válido. Saldo restante: ${formatCRC(availableAmount - amountNum)}`}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="paymentMethod">Método de Pago *</Label>
          <select
            id="paymentMethod"
            {...register("paymentMethod")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia bancaria</option>
            <option value="sinpe">SINPE Móvil</option>
            <option value="cheque">Cheque</option>
            <option value="otro">Otro</option>
          </select>
          {errors.paymentMethod && (
            <p className="text-sm text-destructive">{errors.paymentMethod.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="concept">Concepto *</Label>
        <Textarea
          id="concept"
          {...register("concept")}
          placeholder="Descripción del pago recibido..."
          rows={3}
        />
        {errors.concept && (
          <p className="text-sm text-destructive">{errors.concept.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas Adicionales</Label>
        <Textarea
          id="notes"
          {...register("notes")}
          placeholder="Notas adicionales (opcional)..."
          rows={3}
        />
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {receipt ? "Actualizar Recibo" : "Crear Recibo"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
