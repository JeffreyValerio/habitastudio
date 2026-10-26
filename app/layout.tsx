import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { MainWrapper } from "@/components/layout/main-wrapper";
import { StructuredData } from "@/components/seo/structured-data";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { SITE_URL } from "@/lib/site-url";
import { getPublicCategories } from "@/lib/data/categories";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Habita Studio - Muebles y Remodelaciones de Calidad",
    template: "%s | Habita Studio",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/brand/favicon.svg", type: "image/svg+xml" },
      { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
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
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: "website",
    locale: "es_CR",
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const categories = await getPublicCategories();
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} ${inter.variable} ${cormorant.variable}`}>
        <ThemeProvider defaultTheme="dark" storageKey="habita-studio-theme">
          <StructuredData />
          <MainWrapper categories={categories}>{children}</MainWrapper>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

