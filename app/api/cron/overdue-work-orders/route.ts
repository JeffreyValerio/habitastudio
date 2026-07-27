import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { startOfTodayCR } from "@/lib/utils";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Corre una vez al día (ver vercel.json) y le avisa a todos los admins, en un
// solo correo, cuáles órdenes de trabajo ya pasaron su fecha de compromiso de
// entrega sin haberse marcado como entregadas. Se repite cada día que la OT
// siga vencida y sin entregar (recordatorio diario, no solo una vez).
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const overdue = await prisma.workOrder.findMany({
    where: {
      entregadoCompletedAt: null,
      deliveryDate: { lt: startOfTodayCR() },
    },
    include: {
      quote: { select: { clientName: true, projectName: true, customer: { select: { name: true } } } },
    },
    orderBy: { deliveryDate: "asc" },
  });

  if (overdue.length === 0) {
    return NextResponse.json({ ok: true, overdueCount: 0, emailSent: false });
  }

  const admins = await prisma.user.findMany({
    where: { role: "admin" },
    select: { email: true },
  });
  const adminEmails = admins.map((a) => a.email).filter(Boolean);
  if (adminEmails.length === 0) {
    return NextResponse.json({ ok: true, overdueCount: overdue.length, emailSent: false, reason: "no admin emails" });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const todayMs = startOfTodayCR().getTime();

  const rows = overdue
    .map((wo) => {
      const clientName = wo.quote.customer?.name || wo.quote.clientName;
      const daysLate = Math.round((todayMs - new Date(wo.deliveryDate!).getTime()) / (24 * 60 * 60 * 1000));
      const link = `${baseUrl}/admin/work-orders/${wo.id}`;
      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            <a href="${link}" style="color: #000; font-weight: bold; text-decoration: none;">${wo.workOrderNumber}</a>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${clientName} — ${wo.quote.projectName}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center; color: #dc2626; font-weight: bold;">
            ${daysLate} día${daysLate === 1 ? "" : "s"}
          </td>
        </tr>
      `;
    })
    .join("");

  try {
    await resend.emails.send({
      from: "Habita Studio <info@habitastudio.online>",
      to: adminEmails,
      replyTo: "info@habitastudio.online",
      subject: `⚠️ ${overdue.length} orden${overdue.length === 1 ? "" : "es"} de trabajo con entrega vencida`,
      html: `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
          <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5; padding: 20px;">
            <tr>
              <td align="center">
                <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <tr>
                    <td style="background-color: #ffffff; padding: 30px 40px 20px 40px; text-align: center;">
                      <img src="https://habitastudio.online/images/logo.png" alt="Habita Studio" style="max-width: 200px; height: auto; margin-bottom: 20px;" />
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 0 40px;">
                      <h2 style="margin: 20px 0; font-size: 22px; color: #dc2626;">
                        ⚠️ Órdenes de trabajo con entrega vencida
                      </h2>
                      <p style="margin: 0 0 20px 0; color: #666; line-height: 1.6;">
                        Estas órdenes ya pasaron su fecha de compromiso de entrega y todavía no se han marcado como entregadas:
                      </p>
                      <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <thead>
                          <tr>
                            <th style="text-align: left; padding: 10px; border-bottom: 2px solid #333; font-size: 13px;">OT</th>
                            <th style="text-align: left; padding: 10px; border-bottom: 2px solid #333; font-size: 13px;">Cliente / Proyecto</th>
                            <th style="text-align: center; padding: 10px; border-bottom: 2px solid #333; font-size: 13px;">Atraso</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${rows}
                        </tbody>
                      </table>
                      <table role="presentation" style="margin: 10px 0 30px 0;">
                        <tr>
                          <td bgcolor="#000000" style="background-color: #000000; border-radius: 5px;">
                            <a href="${baseUrl}/admin/work-orders" style="color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                              Ver Órdenes de Trabajo
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f9f9f9; padding: 20px 40px; text-align: center; border-top: 1px solid #eee;">
                      <p style="margin: 0; color: #999; font-size: 12px;">
                        Este aviso se repite cada día mientras la orden siga vencida y sin entregar.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });
  } catch (error) {
    console.error("Error al enviar aviso de OT vencidas:", error);
    return NextResponse.json({ ok: false, overdueCount: overdue.length, emailSent: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true, overdueCount: overdue.length, emailSent: true });
}
