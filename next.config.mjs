/** @type {import('next').NextConfig} */
const nextConfig = {
  // --- ADD THIS FOR DOCKER ---
  output: 'standalone', 
  // ---------------------------

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
