export function StructuredData() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://habitastudio.online'

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "FurnitureStore",
    "name": "Habita Studio",
    "description": "Habita Studio ofrece muebles de calidad y servicios de remodelación profesional. Transformamos espacios con diseño elegante y funcional.",
    "url": baseUrl,
    "logo": `${baseUrl}/logo.png`,
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+1-234-567-890",
      "contactType": "customer service",
      "email": "info@habitastudio.online",
      "availableLanguage": "Spanish"
    },
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "ES"
    },
    "sameAs": [
      "https://facebook.com/habitastudio",
      "https://instagram.com/habitastudio",
      "https://linkedin.com/company/habitastudio"
    ],
    "priceRange": "$$",
    "areaServed": {
      "@type": "Country",
      "name": "España"
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

