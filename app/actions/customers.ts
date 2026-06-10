"use server";

import prisma from "@/lib/prisma";

export async function getCustomers() {
  const quotes = await prisma.quote.findMany({
    include: {
      items: true,
      receipts: true,
    },
  });

  // Agrupar por cliente y calcular totales
  const customerMap = new Map<
    string,
    {
      clientName: string;
      clientEmail?: string | null;
      clientPhone?: string | null;
      totalQuoted: number;
      quotesCount: number;
      totalPaid: number;
      receiptsCount: number;
      lastQuoteDate: Date;
      quotes: typeof quotes;
    }
  >();

  quotes.forEach((quote) => {
    if (!quote.clientName) return;

    const existing = customerMap.get(quote.clientName) || {
      clientName: quote.clientName,
      clientEmail: quote.clientEmail,
      clientPhone: quote.clientPhone,
      totalQuoted: 0,
      quotesCount: 0,
      totalPaid: 0,
      receiptsCount: 0,
      lastQuoteDate: quote.createdAt,
      quotes: [],
    };

    existing.totalQuoted += quote.total;
    existing.quotesCount += 1;
    existing.totalPaid += quote.receipts.reduce((sum, r) => sum + r.amount, 0);
    existing.receiptsCount += quote.receipts.length;
    existing.lastQuoteDate = new Date(
      Math.max(
        existing.lastQuoteDate.getTime(),
        new Date(quote.createdAt).getTime()
      )
    );
    existing.quotes.push(quote);

    customerMap.set(quote.clientName, existing);
  });

  return Array.from(customerMap.values()).sort(
    (a, b) => b.lastQuoteDate.getTime() - a.lastQuoteDate.getTime()
  );
}

export async function getCustomerByName(clientName: string) {
  const quotes = await prisma.quote.findMany({
    where: {
      clientName: clientName,
    },
    include: {
      items: true,
      receipts: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (quotes.length === 0) {
    return null;
  }

  const totalQuoted = quotes.reduce((sum, q) => sum + q.total, 0);
  const totalPaid = quotes.reduce(
    (sum, q) =>
      sum + q.receipts.reduce((receiptSum, r) => receiptSum + r.amount, 0),
    0
  );
  const receiptsCount = quotes.reduce(
    (sum, q) => sum + q.receipts.length,
    0
  );

  return {
    clientName: quotes[0].clientName,
    clientEmail: quotes[0].clientEmail,
    clientPhone: quotes[0].clientPhone,
    clientAddress: quotes[0].clientAddress,
    totalQuoted,
    totalPaid,
    pendingBalance: Math.max(0, totalQuoted - totalPaid),
    quotesCount: quotes.length,
    receiptsCount,
    lastQuoteDate: quotes[0].createdAt,
    quotes,
  };
}
