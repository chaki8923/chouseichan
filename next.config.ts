import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  distDir: '.next',
  images: {
    // X(Twitter)とGoogleのプロフィール画像、およびMicroCMSの画像を表示するために追加
    domains: [
      "2d44ce7061796f9eeb11190723a61cd5.r2.cloudflarestorage.com", 
      "pub-53317959528747efb27d9fca4bdeccd5.r2.dev",
      "pub-be87507c83084dcfb952197522258d84.r2.dev",
      "images.microcms-assets.io" // MicroCMSの画像ドメインを追加
    ],
  },
};

export default nextConfig;
