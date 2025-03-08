import { client } from '@/libs/microcms';

type Blog = {
  id: string;
  title: string;
  category: {
    id: string;
    name: string;
    description: string;
    eyecatch?: {
      url: string;
      height: number;
      width: number;
    };
  } | null;
  eyecatch?: {
    url: string;
    height: number;
    width: number;
  };
  tags: { id: string; name: string }[];
};

export type Category = {
  id: string;
  name: string;
  description: string;
  eyecatch?: {
    url: string;
    height: number;
    width: number;
  };
};

// カテゴリー情報を直接取得する関数
export async function getCategoryById(categoryId: string): Promise<Category | null> {
  try {
    const data = await client.get({
      endpoint: 'categories',
      contentId: categoryId,
    });
    return data;
  } catch (error) {
    console.error('Error fetching category:', error);
    return null;
  }
}

// MicroCMS API からブログ記事を取得
export async function getBlogPosts(categoryId: string): Promise<Blog[]> {
  const data = await client.get({
    endpoint: 'blog',
    queries: {
      limit: 5,
      filters: `category[equals]${categoryId}`,
    },
  });
  
  return data.contents;
}
