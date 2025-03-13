import { MetadataRoute } from 'next';
import { client } from '@/libs/microcms';


type BlogPost = {
  id: string;
  updatedAt: string;
  category?: {
    id: string;
  };
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
];

// 全ルートの結合
const allRoutes = [...primaryRoutes, ...secondaryRoutes, ...tertiaryRoutes];

// microCMSからブログ記事一覧を取得する関数
async function getAllBlogPosts(): Promise<BlogPost[]> {
  try {
    const response = await client.get({
      endpoint: 'blog',
      queries: {
        fields: 'id,publishedAt,updatedAt,category',
        limit: 100, // 必要に応じて調整
      },
    });
    
    return response.contents.map((post: any) => ({
      id: post.id,
      updatedAt: post.publishedAt || post.updatedAt || new Date().toISOString(),
      category: post.category
    }));
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
  
  // カテゴリーごとのブログ一覧ページをサイトマップに追加
  const categoryBlogRoutes = categories.map((category: CategoryData) => ({
    url: `${baseUrl}/blog/${category.id}`,
    lastModified: new Date(category.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));
  
  // 全てのルートを結合して返す
  return [...routes, ...blogRoutes, ...categoryRoutes, ...categoryBlogRoutes];
} 