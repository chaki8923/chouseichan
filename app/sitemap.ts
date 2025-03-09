import { MetadataRoute } from 'next';
import { prisma } from '@/libs/prisma';
import { client } from '@/libs/microcms';

// 型定義
type EventData = {
  id: string;
  updatedAt: Date;
};

type BlogPost = {
  id: string;
  updatedAt: string;
};

type CategoryData = {
  id: string;
  updatedAt: string;
};

// 主要なページのリスト（高優先度）
const primaryRoutes = [
  {
    path: '',
    changeFrequency: 'daily' as const,
    priority: 1.0,
  },
  {
    path: '/image-resize',
    changeFrequency: 'daily' as const,
    priority: 0.9,
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
    path: '/events-calendar',
    changeFrequency: 'daily' as const,
    priority: 0.9,
  },
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

// データベースからイベント一覧を取得する関数
async function getAllEvents(): Promise<EventData[]> {
  try {
    const events = await prisma.event.findMany({
      select: {
        id: true,
        updatedAt: true,
      },
    });
    return events;
  } catch (error) {
    console.error('イベント一覧の取得に失敗しました:', error);
    return [];
  }
}

// microCMSからブログ記事一覧を取得する関数
async function getAllBlogPosts(): Promise<BlogPost[]> {
  try {
    const contentIds = await client.getAllContentIds({ endpoint: 'blog' });
    
    // 各ブログのlastModifiedを取得するために詳細情報も取得
    const blogPosts = await Promise.all(
      contentIds.map(async (id) => {
        const post = await client.get({
          endpoint: 'blog',
          contentId: id,
        });
        return {
          id,
          updatedAt: post.publishedAt || post.updatedAt || new Date().toISOString(),
        };
      })
    );
    
    return blogPosts;
  } catch (error) {
    console.error('ブログ記事一覧の取得に失敗しました:', error);
    return [];
  }
}

// microCMSからカテゴリー一覧を取得する関数
async function getAllCategories(): Promise<CategoryData[]> {
  try {
    // カテゴリーの一覧を取得
    const data = await client.get({
      endpoint: 'categories',
      queries: {
        fields: 'id,createdAt,updatedAt',
        limit: 100, // カテゴリー数に応じて適切な数値に設定
      },
    });
    
    // microCMSから返されるコンテンツ型を定義
    interface MicroCMSCategory {
      id: string;
      updatedAt?: string;
      createdAt?: string;
    }
    
    return data.contents.map((category: MicroCMSCategory) => ({
      id: category.id,
      updatedAt: category.updatedAt || category.createdAt || new Date().toISOString(),
    }));
  } catch (error) {
    console.error('カテゴリー一覧の取得に失敗しました:', error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.chouseichan.com';
  
  // 主要なルートをsitemapに追加
  const routes = allRoutes.map(route => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  })) as MetadataRoute.Sitemap;
  
  // イベント一覧を取得してサイトマップに追加
  const events = await getAllEvents();
  const eventRoutes = events.map((event: EventData) => ({
    url: `${baseUrl}/event?eventId=${event.id}`,
    lastModified: new Date(event.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));
  
  // ブログ記事一覧を取得してサイトマップに追加
  const blogPosts = await getAllBlogPosts();
  const blogRoutes = blogPosts.map((post: BlogPost) => ({
    url: `${baseUrl}/blog/${post.id}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));
  
  // カテゴリー一覧を取得してサイトマップに追加
  const categories = await getAllCategories();
  const categoryRoutes = categories.map((category: CategoryData) => ({
    url: `${baseUrl}/situation?categoryId=${category.id}`,
    lastModified: new Date(category.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));
  
  // 全てのルートを結合して返す
  return [...routes, ...eventRoutes, ...blogRoutes, ...categoryRoutes];
} 