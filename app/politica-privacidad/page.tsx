import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description: "Política de privacidad de Habita Studio. Información sobre cómo recopilamos, usamos y protegemos tus datos personales.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Política de Privacidad
          </h1>
          <p className="mt-4 text-muted-foreground">
            Última actualización: {new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
          </p>

          <Separator className="my-8" />

          <div className="prose prose-lg max-w-none space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>1. Información que Recopilamos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  En Habita Studio, recopilamos información que nos proporcionas directamente cuando:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Completas formularios de contacto o solicitud de cotización</li>
                  <li>Te suscribes a nuestro newsletter o comunicaciones</li>
                  <li>Realizas una consulta o solicitas información sobre nuestros servicios</li>
                  <li>Interactúas con nuestro sitio web</li>
                </ul>
                <p className="text-muted-foreground">
                  La información que recopilamos puede incluir: nombre, dirección de correo electrónico, número de teléfono, dirección postal, y cualquier otra información que elijas proporcionarnos.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. Uso de la Información</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Utilizamos la información recopilada para:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Responder a tus consultas y solicitudes</li>
                  <li>Proporcionar nuestros servicios de diseño y remodelación</li>
                  <li>Enviar información sobre nuestros productos y servicios</li>
                  <li>Mejorar nuestro sitio web y experiencia del usuario</li>
                  <li>Cumplir con obligaciones legales y regulatorias</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3. Protección de Datos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Implementamos medidas de seguridad técnicas y organizativas apropiadas para proteger tu información personal contra acceso no autorizado, alteración, divulgación o destrucción. Sin embargo, ningún método de transmisión por Internet o almacenamiento electrónico es 100% seguro.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>4. Compartir Información</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  No vendemos, alquilamos ni compartimos tu información personal con terceros, excepto en las siguientes circunstancias:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Con proveedores de servicios que nos ayudan a operar nuestro negocio (sujetos a acuerdos de confidencialidad)</li>
                  <li>Cuando sea requerido por ley o para proteger nuestros derechos legales</li>
                  <li>Con tu consentimiento explícito</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>5. Cookies y Tecnologías Similares</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Utilizamos cookies y tecnologías similares para mejorar tu experiencia en nuestro sitio web. Puedes gestionar tus preferencias de cookies a través de la configuración de tu navegador. Para más información, consulta nuestra{" "}
                  <a href="/cookies" className="text-primary hover:underline">
                    Política de Cookies
                  </a>
                  .
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>6. Tus Derechos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Tienes derecho a:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Acceder a tu información personal</li>
                  <li>Rectificar información inexacta o incompleta</li>
                  <li>Solicitar la eliminación de tus datos personales</li>
                  <li>Oponerte al procesamiento de tus datos</li>
                  <li>Solicitar la portabilidad de tus datos</li>
                  <li>Retirar tu consentimiento en cualquier momento</li>
                </ul>
                <p className="text-muted-foreground">
                  Para ejercer estos derechos, contáctanos en{" "}
                  <a href="mailto:info@habitastudio.online" className="text-primary hover:underline">
                    info@habitastudio.online
                  </a>
                  .
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>7. Retención de Datos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Conservamos tu información personal durante el tiempo necesario para cumplir con los propósitos descritos en esta política, a menos que la ley requiera o permita un período de retención más largo.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>8. Cambios a esta Política</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Podemos actualizar esta Política de Privacidad ocasionalmente. Te notificaremos sobre cambios significativos publicando la nueva política en esta página y actualizando la fecha de &quot;Última actualización&quot;.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>9. Contacto</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Si tienes preguntas sobre esta Política de Privacidad, puedes contactarnos en:
                </p>
                <div className="mt-4 space-y-2 text-muted-foreground">
                  <p>
                    <strong>Email:</strong>{" "}
                    <a href="mailto:info@habitastudio.online" className="text-primary hover:underline">
                      info@habitastudio.online
                    </a>
                  </p>
                  <p>
                    <strong>Teléfono:</strong>{" "}
                    <a href="tel:+1234567890" className="text-primary hover:underline">
                      +1 (234) 567-890
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

