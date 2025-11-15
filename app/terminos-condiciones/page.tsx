import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Términos y Condiciones",
  description: "Términos y condiciones de uso de Habita Studio. Condiciones de servicio, uso del sitio web y contratación de servicios.",
};

export default function TermsPage() {
  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Términos y Condiciones
          </h1>
          <p className="mt-4 text-muted-foreground">
            Última actualización: {new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
          </p>

          <Separator className="my-8" />

          <div className="prose prose-lg max-w-none space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>1. Aceptación de los Términos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Al acceder y utilizar el sitio web de Habita Studio, aceptas cumplir con estos Términos y Condiciones. Si no estás de acuerdo con alguna parte de estos términos, no debes utilizar nuestro sitio web.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. Uso del Sitio Web</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  El sitio web de Habita Studio está destinado para uso personal y comercial legítimo. Está prohibido:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Utilizar el sitio para fines ilegales o no autorizados</li>
                  <li>Intentar acceder a áreas restringidas del sitio</li>
                  <li>Interferir con el funcionamiento del sitio web</li>
                  <li>Reproducir, duplicar o copiar el contenido sin autorización</li>
                  <li>Utilizar robots, scripts o métodos automatizados para acceder al sitio</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3. Propiedad Intelectual</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Todo el contenido del sitio web, incluyendo textos, gráficos, logotipos, imágenes, y software, es propiedad de Habita Studio o sus proveedores de contenido y está protegido por leyes de derechos de autor y otras leyes de propiedad intelectual. No puedes reproducir, distribuir, modificar o crear obras derivadas sin nuestro consentimiento previo por escrito.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>4. Servicios y Contratación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Los servicios de Habita Studio están sujetos a:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Disponibilidad y aceptación de cada proyecto</li>
                  <li>Presupuestos y contratos específicos para cada servicio</li>
                  <li>Condiciones de pago acordadas en el contrato</li>
                  <li>Plazos de ejecución establecidos en cada proyecto</li>
                </ul>
                <p className="text-muted-foreground">
                  Las cotizaciones tienen validez limitada y están sujetas a cambios según disponibilidad de materiales y condiciones del mercado.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>5. Precios y Pagos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Los precios mostrados en el sitio web son indicativos y pueden variar. Los precios finales se establecerán en el presupuesto y contrato correspondiente. Los términos de pago se acordarán específicamente para cada proyecto y se detallarán en el contrato de servicios.
                </p>
                <p className="text-muted-foreground">
                  Habita Studio se reserva el derecho de modificar precios en cualquier momento, pero los cambios no afectarán proyectos ya contratados.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>6. Garantías y Responsabilidades</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Habita Studio garantiza la calidad de sus servicios según los términos establecidos en cada contrato. Sin embargo:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>No garantizamos resultados específicos más allá de lo acordado contractualmente</li>
                  <li>No somos responsables de daños indirectos o consecuentes</li>
                  <li>Nuestra responsabilidad está limitada al valor del contrato de servicios</li>
                  <li>Las garantías están sujetas a uso normal y mantenimiento adecuado</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>7. Enlaces a Terceros</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Nuestro sitio web puede contener enlaces a sitios web de terceros. No tenemos control sobre el contenido de estos sitios y no asumimos responsabilidad por ellos. La inclusión de enlaces no implica respaldo de Habita Studio.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>8. Limitación de Responsabilidad</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  En la máxima medida permitida por la ley, Habita Studio no será responsable de ningún daño directo, indirecto, incidental, especial o consecuente que resulte del uso o la imposibilidad de usar nuestro sitio web o servicios.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>9. Modificaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Habita Studio se reserva el derecho de modificar estos Términos y Condiciones en cualquier momento. Los cambios entrarán en vigor inmediatamente después de su publicación en el sitio web. Es tu responsabilidad revisar periódicamente estos términos.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>10. Ley Aplicable y Jurisdicción</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Estos Términos y Condiciones se rigen por las leyes del país donde Habita Studio opera. Cualquier disputa relacionada con estos términos será sometida a la jurisdicción exclusiva de los tribunales competentes.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>11. Contacto</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Si tienes preguntas sobre estos Términos y Condiciones, puedes contactarnos en:
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

