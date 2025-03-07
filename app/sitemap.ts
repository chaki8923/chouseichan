import { MetadataRoute } from 'next';

// 主要なページのリスト
const mainRoutes = [
  '',
  '/description',
  '/situation',
  '/privacy',
  '/rule',
  '/infomation',
  '/blog',
];

// 動的に取得したイベント情報をsitemapに追加するには、
// ここでデータベースからイベントIDを取得して、URLリストに追加する処理を行います

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.chouseichan.com';
  
  // 主要なルートをsitemapに追加
  const routes = mainRoutes.map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: route === '' ? 1.0 : 0.8,
  })) as MetadataRoute.Sitemap;
  
  // 動的なページ（例：ブログ投稿など）をここで追加
  // 実際の実装ではデータベースからクエリを行う
  
  return routes;
} 