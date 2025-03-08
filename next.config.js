/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // ビルド時のTypeScriptエラーを警告として扱い、ビルドを失敗させない
    ignoreBuildErrors: true,
  },
  eslint: {
    // ビルド時のESLintエラーを警告として扱い、ビルドを失敗させない
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-be87507c83084dcfb952197522258d84.r2.dev',
        port: '',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: '2d44ce7061796f9eeb11190723a61cd5.r2.cloudflarestorage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pub-53317959528747efb27d9fca4bdeccd5.r2.dev',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.microcms-assets.io',
        port: '',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig 