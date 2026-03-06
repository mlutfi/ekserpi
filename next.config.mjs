/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4001',
      },
    ],
  },
  devIndicators: {
    position: 'bottom-right', // Choices: 'bottom-left', 'bottom-right', 'top-right', 'top-left'
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api'}/:path*`,
      },
    ]
  },
}

export default nextConfig
