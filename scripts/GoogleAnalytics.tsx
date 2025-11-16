'use client'

import Script from "next/script"
import * as gtag from '../gtag'

const GoogleAnalytics = () => {
    return (
        <>
            <Script
                strategy="afterInteractive"
                src={`https://www.googletagmanager.com/gtag/js?id=${gtag.GA_TRACKING_ID}`}
            />
            <Script
                id="gtag-init"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
                      window.dataLayer = window.dataLayer || [];
                      function gtag(){dataLayer.push(arguments);}
                      gtag('js', new Date());
                      gtag('config', '${gtag.GA_TRACKING_ID}', {
                        page_path: window.location.pathname,
                        page_title: document.title,
                        send_page_view: true,
                        custom_map: {
                          'custom_parameter_1': 'enfermeria_domicilio',
                          'custom_parameter_2': 'costa_rica'
                        }
                      });
                      
                      // Eventos personalizados para tracking
                      gtag('event', 'page_view', {
                        page_title: document.title,
                        page_location: window.location.href,
                        page_path: window.location.pathname,
                        content_group1: 'Enfermería a Domicilio',
                        content_group2: 'Costa Rica'
                      });
                    `,
                }}
            />
        </>
    )
}

export default GoogleAnalytics