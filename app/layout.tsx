import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MainWrapper } from "@/components/layout/main-wrapper";
import { StructuredData } from "@/components/seo/structured-data";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import GoogleAnalytics from "@/scripts/GoogleAnalytics";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Habita Studio - Muebles y Remodelaciones de Calidad",
    template: "%s | Habita Studio",
  },
  icons: {
    icon: '/images/logo.webp',
    shortcut: '/images/logo.webp',
    apple: '/images/logo.webp',
  },
  description: "Habita Studio ofrece muebles de calidad y servicios de remodelación profesional. Transformamos espacios con diseño elegante y funcional.",
  keywords: ["muebles", "remodelaciones", "diseño de interiores", "mobiliario", "decoración", "cocinas", "baños", "salas"],
  authors: [{ name: "Habita Studio" }],
  creator: "Habita Studio",
  publisher: "Habita Studio",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://habitastudio.online"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "/",
    title: "Habita Studio - Muebles y Remodelaciones de Calidad",
    description: "Habita Studio ofrece muebles de calidad y servicios de remodelación profesional.",
    siteName: "Habita Studio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Habita Studio - Muebles y Remodelaciones de Calidad",
    description: "Habita Studio ofrece muebles de calidad y servicios de remodelación profesional.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href={process.env.NEXT_PUBLIC_SITE_URL || "https://habitastudio.online"} />
      </head>
      <body className={inter.className}>
        <ThemeProvider defaultTheme="dark" storageKey="habita-studio-theme">
          <StructuredData />
          <MainWrapper>{children}</MainWrapper>
          <Toaster />

          <GoogleAnalytics />
        </ThemeProvider>
      </body>
    </html>
  );
}

