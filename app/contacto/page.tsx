import { Metadata } from "next";
import { ContactForm } from "@/components/forms/contact-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Mail, MapPin, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Contáctanos para solicitar una cotización gratuita. Habita Studio está aquí para ayudarte a transformar tus espacios. Teléfono, email y formulario de contacto.",
};

const contactInfo = [
  {
    icon: Phone,
    title: "Teléfono",
    content: "+1 (234) 567-890",
    link: "tel:+1234567890",
  },
  {
    icon: Mail,
    title: "Email",
    content: "info@habitastudio.online",
    link: "mailto:info@habitastudio.online",
  },
  {
    icon: MapPin,
    title: "Dirección",
    content: "Dirección de la empresa, Ciudad, País",
    link: "#",
  },
  {
    icon: Clock,
    title: "Horario",
    content: "Lun - Vie: 9:00 AM - 6:00 PM",
    link: "#",
  },
];

export default function ContactPage() {
  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Contáctanos
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Estamos aquí para ayudarte a transformar tus espacios
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div>
            <h2 className="mb-6 text-2xl font-semibold">Envíanos un Mensaje</h2>
            <ContactForm />
          </div>

          <div>
            <h2 className="mb-6 text-2xl font-semibold">Información de Contacto</h2>
            <div className="space-y-4">
              {contactInfo.map((info) => {
                const Icon = info.icon;
                return (
                  <Card key={info.title}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-lg">{info.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {info.link !== "#" ? (
                        <a
                          href={info.link}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {info.content}
                        </a>
                      ) : (
                        <p className="text-muted-foreground">{info.content}</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

