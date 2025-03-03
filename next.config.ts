import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  distDir: '.next',
  images: {
    // X(Twitter)とGoogleのプロフィール画像を表示するために追加
    domains: ["2d44ce7061796f9eeb11190723a61cd5.r2.cloudflarestorage.com"],
  },
};

export default nextConfig;
