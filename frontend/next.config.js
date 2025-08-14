/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'res.cloudinary.com', 'images.unsplash.com', 'via.placeholder.com'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://broskate2-production.up.railway.app',
    NEXT_PUBLIC_MAPBOX_TOKEN:
      process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
      'pk.eyJ1Ijoicm9nZXJpb3NhbnRvcyIsImEiOiJjbWU0cGJrN3QwajNjMmpzODJhaGdldGtpIn0.N9l-8X_nrV62P5LR1Gjsxg',
  },
};

module.exports = nextConfig;
