import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Política de Cookies",
  description: "Información sobre el uso de cookies en el sitio web de Habita Studio. Tipos de cookies, su propósito y cómo gestionarlas.",
};

export default function CookiesPage() {
  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Política de Cookies
          </h1>
          <p className="mt-4 text-muted-foreground">
            Última actualización: {new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
          </p>

          <Separator className="my-8" />

          <div className="prose prose-lg max-w-none space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>¿Qué son las Cookies?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas un sitio web. Permiten que el sitio web recuerde tus acciones y preferencias durante un período de tiempo, por lo que no tienes que volver a configurarlas cada vez que regresas al sitio o navegas de una página a otra.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tipos de Cookies que Utilizamos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Cookies Esenciales</h3>
                  <p className="text-muted-foreground">
                    Estas cookies son necesarias para el funcionamiento del sitio web y no se pueden desactivar. Incluyen cookies que permiten recordar tus preferencias de idioma, tema (modo oscuro/claro), y otras configuraciones básicas.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Cookies de Rendimiento</h3>
                  <p className="text-muted-foreground">
                    Estas cookies nos ayudan a entender cómo los visitantes interactúan con nuestro sitio web, proporcionándonos información sobre las áreas visitadas, el tiempo de permanencia y cualquier problema encontrado. Esta información nos ayuda a mejorar el funcionamiento del sitio web.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Cookies de Funcionalidad</h3>
                  <p className="text-muted-foreground">
                    Estas cookies permiten que el sitio web recuerde las elecciones que haces (como tu nombre de usuario, idioma o región) para proporcionar características mejoradas y más personales.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cookies de Terceros</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Algunas cookies son colocadas por servicios de terceros que aparecen en nuestras páginas. Por ejemplo, podemos utilizar servicios de análisis como Google Analytics para ayudarnos a entender cómo se utiliza nuestro sitio web. Estos servicios pueden establecer sus propias cookies en tu dispositivo.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gestión de Cookies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Puedes controlar y/o eliminar las cookies como desees. Puedes eliminar todas las cookies que ya están en tu dispositivo y puedes configurar la mayoría de los navegadores para evitar que se coloquen. Sin embargo, si haces esto, es posible que tengas que ajustar manualmente algunas preferencias cada vez que visites un sitio y que algunos servicios y funcionalidades no funcionen.
                </p>
                <div>
                  <h3 className="font-semibold mb-2">Cómo Gestionar las Cookies en tu Navegador</h3>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li>
                      <strong>Chrome:</strong> Configuración → Privacidad y seguridad → Cookies y otros datos de sitios
                    </li>
                    <li>
                      <strong>Firefox:</strong> Opciones → Privacidad y seguridad → Cookies y datos del sitio
                    </li>
                    <li>
                      <strong>Safari:</strong> Preferencias → Privacidad → Cookies y datos de sitios web
                    </li>
                    <li>
                      <strong>Edge:</strong> Configuración → Cookies y permisos del sitio → Cookies y datos del sitio
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cookies que Utilizamos Específicamente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Preferencias de Tema</h3>
                    <p className="text-sm text-muted-foreground">
                      <strong>Nombre:</strong> habita-studio-theme<br />
                      <strong>Propósito:</strong> Almacena tu preferencia de tema (modo oscuro/claro)<br />
                      <strong>Duración:</strong> Persistente
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actualizaciones de esta Política</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Podemos actualizar esta Política de Cookies ocasionalmente para reflejar cambios en las cookies que utilizamos o por otras razones operativas, legales o regulatorias. Te recomendamos que revises esta página periódicamente para estar informado sobre nuestro uso de cookies.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contacto</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Si tienes preguntas sobre nuestra Política de Cookies, puedes contactarnos en:
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

