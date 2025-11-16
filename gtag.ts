export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GOOGLE_ID

// Función para tracking de páginas
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag("config", GA_TRACKING_ID, {
      page_path: url,
      page_title: document.title,
      page_location: window.location.href,
    })
  }
}

// Función para eventos personalizados
export const event = ({ action, category, label, value }: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// Eventos específicos para el negocio
export const trackContactForm = () => {
  event({
    action: 'contact_form_submit',
    category: 'engagement',
    label: 'contact_form',
  })
}

export const trackPhoneClick = () => {
  event({
    action: 'phone_click',
    category: 'engagement',
    label: 'phone_number',
  })
}

export const trackWhatsAppClick = () => {
  event({
    action: 'whatsapp_click',
    category: 'engagement',
    label: 'whatsapp_button',
  })
}

export const trackServiceInquiry = (serviceName: string) => {
  event({
    action: 'service_inquiry',
    category: 'engagement',
    label: serviceName,
  })
}

// Declaración global para TypeScript
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}