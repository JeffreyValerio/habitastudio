import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, subject, message } = body;

    // Validación básica
    if (!name || !email || !phone || !subject || !message) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    // Sanitizar inputs para evitar XSS
    const sanitizeHtml = (str: string) => {
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    const sanitizedName = sanitizeHtml(name);
    const sanitizedEmail = sanitizeHtml(email);
    const sanitizedPhone = sanitizeHtml(phone);
    const sanitizedSubject = sanitizeHtml(subject);
    const sanitizedMessage = sanitizeHtml(message).replace(/\n/g, "<br>");

    // Versión en texto plano
    const textVersion = `
Nuevo Mensaje de Contacto - Habita Studio

Información del Contacto:
-------------------------
Nombre: ${name}
Email: ${email}
Teléfono: ${phone}
Asunto: ${subject}

Mensaje:
--------
${message}

---
Este mensaje fue enviado desde el formulario de contacto de Habita Studio.
www.habitastudio.online
    `.trim();

    // Versión HTML mejorada
    const htmlVersion = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nuevo Mensaje de Contacto</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #4f46e5; padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                Nuevo Mensaje de Contacto
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 18px; font-weight: 600;">
                Información del Contacto
              </h2>
              
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border-radius: 6px; padding: 20px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 8px 0; color: #4b5563; font-size: 14px;"><strong style="color: #1f2937;">Nombre:</strong></td>
                  <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">${sanitizedName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #4b5563; font-size: 14px;"><strong style="color: #1f2937;">Email:</strong></td>
                  <td style="padding: 8px 0; color: #1f2937; font-size: 14px;"><a href="mailto:${sanitizedEmail}" style="color: #4f46e5; text-decoration: none;">${sanitizedEmail}</a></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #4b5563; font-size: 14px;"><strong style="color: #1f2937;">Teléfono:</strong></td>
                  <td style="padding: 8px 0; color: #1f2937; font-size: 14px;"><a href="tel:${sanitizedPhone}" style="color: #4f46e5; text-decoration: none;">${sanitizedPhone}</a></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #4b5563; font-size: 14px;"><strong style="color: #1f2937;">Asunto:</strong></td>
                  <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">${sanitizedSubject}</td>
                </tr>
              </table>
              
              <h2 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px; font-weight: 600;">
                Mensaje
              </h2>
              
              <div style="background-color: #ffffff; padding: 20px; border-left: 4px solid #4f46e5; border-radius: 4px; color: #374151; font-size: 14px; line-height: 1.6;">
                ${sanitizedMessage}
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 1.5;">
                Este mensaje fue enviado desde el formulario de contacto de<br>
                <strong style="color: #4f46e5;">Habita Studio</strong> - www.habitastudio.online
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    // Enviar email usando Resend
    const { data, error } = await resend.emails.send({
      from: "Habita Studio <info@habitastudio.online>", 
      to: ["info@habitastudio.online"],
      replyTo: email,
      subject: `Nuevo mensaje de contacto: ${subject}`,
      text: textVersion,
      html: htmlVersion,
    });

    if (error) {
      console.error("Error de Resend:", error);
      return NextResponse.json(
        { error: "Error al enviar el mensaje. Por favor intenta nuevamente." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Mensaje enviado correctamente", id: data?.id },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error enviando email:", error);
    return NextResponse.json(
      { error: "Error al enviar el mensaje. Por favor intenta nuevamente." },
      { status: 500 }
    );
  }
}
