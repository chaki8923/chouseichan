import { client } from '@/libs/microcms';

type Blog = {
  id: string;
  title: string;
  category: {
    id: string;
    name: string;
    description: string;
  } | null;
  eyecatch?: {
    url: string;
    height: number;
    width: number;
};
tags: { id: string; name: string }[];
};

// MicroCMS API からブログ記事を取得
export async function getBlogPosts(categoryId: string): Promise<Blog[]> {
  const data = await client.get({
    endpoint: 'blog',
    queries: {
      limit: 5,
      filters: `category[equals]${categoryId}`,
    },
  });
  console.log("data", data);
  
  
  return data.contents;
}
