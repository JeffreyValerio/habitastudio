import { SITE_URL } from '@/lib/site-url'

export function StructuredData() {
  const baseUrl = SITE_URL

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "FurnitureStore",
    "name": "Habita Studio",
    "description": "Habita Studio ofrece muebles de calidad y servicios de remodelación profesional. Transformamos espacios con diseño elegante y funcional.",
    "url": baseUrl,
    "logo": `${baseUrl}/brand/logo-vertical-color.png`,
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+506 6364 4915",
      "contactType": "customer service",
      "email": "info@habitastudio.online",
      "availableLanguage": "Spanish"
    },
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "CR"
    },
    "sameAs": [
      "https://facebook.com/habitastudio",
      "https://instagram.com/habitastudio",
      "https://linkedin.com/company/habitastudio"
    ],
    "priceRange": "$$",
    "areaServed": {
      "@type": "Country",
      "name": "Costa Rica"
    }
  }

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Habita Studio",
    "url": baseUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}/catalogo?buscar={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  )
}

