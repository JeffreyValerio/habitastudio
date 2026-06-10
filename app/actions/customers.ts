"use server";

import prisma from "@/lib/prisma";

// Obtener mapa de clientes con totales
function buildCustomerMap(quotes: any[]) {
  const customerMap = new Map<string, any>();

  quotes.forEach((quote) => {
    if (!quote.clientName) return;

    const existing = customerMap.get(quote.clientName) || {
      clientName: quote.clientName,
      clientEmail: quote.clientEmail,
      clientPhone: quote.clientPhone,
      clientAddress: quote.clientAddress,
      totalQuoted: 0,
      totalPaid: 0,
      quotesCount: 0,
      acceptedCount: 0,
      receiptsCount: 0,
      lastQuoteDate: quote.createdAt,
      lastQuoteStatus: quote.status,
    };

    existing.totalQuoted += quote.total;
    existing.quotesCount += 1;
    if (quote.status === "accepted") existing.acceptedCount += 1;
    existing.totalPaid += quote.receipts?.reduce((sum: number, r: any) => sum + r.amount, 0) || 0;
    existing.receiptsCount += quote.receipts?.length || 0;
    existing.lastQuoteDate = new Date(
      Math.max(
        existing.lastQuoteDate.getTime(),
        new Date(quote.createdAt).getTime()
      )
    );

    customerMap.set(quote.clientName, existing);
  });

  return customerMap;
}

// Obtener todos los clientes con totales
export async function getCustomers() {
  const quotes = await prisma.quote.findMany({
    include: { receipts: true },
  });

  const customerMap = buildCustomerMap(quotes);
  return Array.from(customerMap.values()).sort(
    (a, b) => b.lastQuoteDate.getTime() - a.lastQuoteDate.getTime()
  );
}

// Obtener CRM Dashboard KPIs
export async function getCRMDashboard() {
  const quotes = await prisma.quote.findMany({
    include: { receipts: true },
  });

  const customerMap = buildCustomerMap(quotes);
  const customers = Array.from(customerMap.values());

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // KPIs
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.lastQuoteDate >= thirtyDaysAgo).length;
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalPaid, 0);
  const totalPipeline = customers.reduce((sum, c) => sum + (c.totalQuoted - c.totalPaid), 0);

  // Pipeline: contar clientes por estado
  const pipelineByStatus = {
    prospect: customers.filter((c) => c.quotesCount === 0).length,
    quoted: customers.filter((c) => c.quotesCount > 0 && c.acceptedCount === 0).length,
    accepted: customers.filter((c) => c.acceptedCount > 0 && c.totalPaid === 0).length,
    paid: customers.filter((c) => c.totalPaid > 0).length,
  };

  // Top clientes por volumen
  const topCustomers = customers
    .sort((a, b) => b.totalQuoted - a.totalQuoted)
    .slice(0, 5);

  // Clientes con problemas (vencidas sin pagar)
  const expiredQuotes = await prisma.quote.findMany({
    where: {
      status: "sent",
      validUntil: { lt: now },
    },
    include: { receipts: true },
  });

  const customersWithExpiredQuotes = new Set(
    expiredQuotes.map((q) => q.clientName)
  );

  // Clientes inactivos (sin cotizaciones en últimos 30 días)
  const inactiveCustomers = customers.filter(
    (c) => c.lastQuoteDate < thirtyDaysAgo
  );

  return {
    kpis: {
      totalCustomers,
      activeCustomers,
      totalRevenue,
      totalPipeline,
    },
    pipeline: pipelineByStatus,
    topCustomers,
    customersWithExpiredQuotes: customersWithExpiredQuotes.size,
    inactiveCustomers: inactiveCustomers.slice(0, 5),
    allCustomers: customers,
  };
}

// Obtener detalle de un cliente
export async function getCustomerByName(clientName: string) {
  const quotes = await prisma.quote.findMany({
    where: { clientName },
    include: { receipts: true, items: true },
    orderBy: { createdAt: "desc" },
  });

  if (quotes.length === 0) return null;

  const totalQuoted = quotes.reduce((sum, q) => sum + q.total, 0);
  const totalPaid = quotes.reduce(
    (sum, q) =>
      sum + q.receipts.reduce((receiptSum, r) => receiptSum + r.amount, 0),
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
    receiptsCount: quotes.reduce((sum, q) => sum + q.receipts.length, 0),
    lastQuoteDate: quotes[0].createdAt,
    quotes,
  };
}
