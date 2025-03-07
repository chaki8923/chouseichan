import { MetadataRoute } from 'next';

// 主要なページのリスト（高優先度）
const primaryRoutes = [
  {
    path: '',
    changeFrequency: 'daily' as const,
    priority: 1.0,
  },
  {
    path: '/situation',
    changeFrequency: 'daily' as const,
    priority: 0.9,
  },
];

// 二次的なページのリスト（中優先度）
const secondaryRoutes = [
  {
    path: '/description',
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  },
  {
    path: '/infomation',
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  },
  {
    path: '/blog',
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  },
];

// 補足的なページのリスト（低優先度）
const tertiaryRoutes = [
  {
    path: '/privacy',
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  },
  {
    path: '/rule',
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  },
  {
    path: '/contact',
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  },
];

// 全ルートの結合
const allRoutes = [...primaryRoutes, ...secondaryRoutes, ...tertiaryRoutes];

// 動的に取得したイベント情報をsitemapに追加するには、
// ここでデータベースからイベントIDを取得して、URLリストに追加する処理を行います

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.chouseichan.com';
  
  // 主要なルートをsitemapに追加
  const routes = allRoutes.map(route => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  })) as MetadataRoute.Sitemap;
  
  // 注意: 実運用では以下のように動的なページ（イベントページ、ブログ記事など）を追加することをお勧めします
  // この部分はデータベースからデータを取得する必要があります
  /*
  // データベースからのイベントID取得を模擬
  const eventIds = await db.event.findMany({
    select: { id: true },
    where: { isPublic: true },
  });

  // イベントページを追加
  const eventRoutes = eventIds.map(({ id }) => ({
    url: `${baseUrl}/event?eventId=${id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...routes, ...eventRoutes];
  */
  
  return routes;
} 