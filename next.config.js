/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    // Derivar cloud name para el cliente desde CLOUDINARY_URL si no existe la pública
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || (process.env.CLOUDINARY_URL ? process.env.CLOUDINARY_URL.split('@').pop()?.split('/')[0] : undefined),
  },
  images: {
    remotePatterns: [
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
  // Aumentar límite de tamaño del body para permitir subir múltiples imágenes
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
}

module.exports = nextConfig
