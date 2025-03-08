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
    ],
  },
}

module.exports = nextConfig 