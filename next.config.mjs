/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Las fichas de los pueblos se leen del disco en tiempo de ejecución:
    // hay que incluirlas en el paquete de las funciones de Vercel.
    outputFileTracingIncludes: {
      '/**': ['./data/pueblos/**'],
    },
  },
};

export default nextConfig;
