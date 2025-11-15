# Habita Studio - Sitio Web Profesional

Sitio web profesional para Habita Studio, empresa especializada en muebles y remodelaciones. Desarrollado con Next.js 15, shadcn/ui, Zod y React Hook Form.

## 🚀 Características

- **100% SEO Optimizado**: Metadata, sitemap, robots.txt y datos estructurados (JSON-LD)
- **Diseño Elegante y Profesional**: Interfaz moderna y limpia que refleja calidad
- **Totalmente Responsive**: Optimizado para todos los dispositivos
- **Formularios Validados**: Validación robusta con Zod y React Hook Form
- **Performance**: Optimizado con Next.js 14 y App Router

## 📋 Secciones

- **Inicio**: Hero section, servicios destacados, proyectos y productos
- **Sobre Nosotros**: Historia, valores y misión de la empresa
- **Catálogo**: Galería completa de productos con filtros
- **Proyectos**: Portafolio de trabajos realizados
- **Servicios**: Detalles de todos los servicios ofrecidos
- **Blog**: Artículos sobre diseño, tendencias y consejos
- **Contacto**: Formulario de contacto con validación

## 🛠️ Tecnologías

- **Next.js 15**: Framework React con App Router (última versión)
- **React 19**: Biblioteca UI (última versión)
- **TypeScript**: Tipado estático
- **Tailwind CSS**: Estilos utilitarios
- **shadcn/ui**: Componentes UI elegantes
- **Zod**: Validación de esquemas
- **React Hook Form**: Manejo de formularios
- **Lucide React**: Iconos

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build

# Iniciar en producción
npm start
```

## 🔧 Configuración

1. Crea un archivo `.env.local` con:
```env
NEXT_PUBLIC_SITE_URL=https://habitastudio.online
GOOGLE_VERIFICATION=tu-codigo-verificacion
```

2. Actualiza la información de contacto en:
   - `components/layout/footer.tsx`
   - `app/contacto/page.tsx`
   - `components/seo/structured-data.tsx`

## 📝 SEO

El sitio incluye:
- Metadata optimizada para cada página
- Sitemap.xml generado automáticamente
- Robots.txt configurado
- Datos estructurados (JSON-LD) para Google
- Open Graph y Twitter Cards
- URLs canónicas

## 🎨 Personalización

- Colores: Edita `app/globals.css` para cambiar la paleta
- Contenido: Actualiza los datos en cada página
- Imágenes: Reemplaza las URLs de Unsplash con tus propias imágenes

## 📄 Licencia

Todos los derechos reservados © Habita Studio

