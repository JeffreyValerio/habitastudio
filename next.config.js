/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    // Derivar cloud name para el cliente desde CLOUDINARY_URL si no existe la pública
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || (process.env.CLOUDINARY_URL ? process.env.CLOUDINARY_URL.split('@').pop()?.split('/')[0] : undefined),
  },
  images: {
    remotePatterns: [
      // Un producto en la BD aún usa una imagen de Unsplash
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  // Redirecciones 308 reales para los slugs viejos de productos
  async redirects() {
    const map = require('./lib/product-slug-redirects.json')
    return Object.entries(map).map(([from, to]) => ({
      source: `/catalogo/${from}`,
      destination: `/catalogo/${to}`,
      permanent: true,
    }))
  },
  // Aumentar límite de tamaño del body para permitir subir múltiples imágenes
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
}

module.exports = nextConfig
