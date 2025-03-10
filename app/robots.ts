import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.chouseichan.com';
  
  return {
    rules: [
      {
        // 一般的な検索エンジン向けルール
        userAgent: '*',
        allow: [
          '/',
          '/event',
          '/events-calendar',
          '/image-resize',
          '/situation',
          '/description',
          '/infomation',
          '/privacy',
          '/rule',
        ],
        disallow: [
          '/api/',
          '/contact',
          '/_next/',
          '/_vercel/',
          '/server-sitemap.xml',
          '/*.json$',
          '/*_buildManifest.js$',
          '/*_middlewareManifest.js$',
          '/*_ssgManifest.js$',
          '/*.js.map$',
        ],
      },
      {
        // Googlebot向け特別ルール
        userAgent: 'Googlebot',
        allow: '/',
        // Googleの画像検索にも登録したい場合は images/ フォルダも許可
        disallow: [
          '/api/',
          '/_next/',
          '/_vercel/',
          '/*.json$',
        ],
      },
      {
        // Bingbot向けルール
        userAgent: 'Bingbot',
        allow: '/',
        disallow: [
          '/api/',
          '/_next/',
          '/_vercel/',
        ],
      },
      {
        // モバイル特化クローラー向け
        userAgent: 'Googlebot-Mobile',
        allow: '/',
        disallow: [
          '/api/',
          '/_next/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
} 