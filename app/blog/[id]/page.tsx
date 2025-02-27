// app/blog/[id]/page.tsx
import { client } from '@/libs/microcms';
import dayjs from 'dayjs';
import styles from "./index.module.scss"


// ブログ記事の型定義
type Props = {
  id: string;
  title: string;
  body: string;
  publishedAt: string;
  category: { name: string };
};

interface SearchParams {
  categoryId?: string;
}

type Blog = {
  id: string;
  title: string;
  eyecatch?: {
      url: string;
      height: number;
      width: number;
  };
  category: {
      id: string;
      name: string;
  } | null;
  tags: {id: string; name: string;}[]
};

type PageProps = {
  searchParams: Promise<SearchParams>;
  id: string;
  title: string;
  category: {
      id: string;
      name: string;
  } | null;
};
// microCMSから特定の記事を取得
async function getBlogPost(id: string): Promise<Props> {
  const data = await client.get({
    endpoint: `blog/${id}`,
  });
  return data;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {

  const { id } = await params; // IDを取得
  const blogData = await getBlogPost(id);

  if (!blogData) {
      return {
          title: "ブログが見つかりません",
          description: "指定されたイベントが存在しません。",
      };
  }

  

  return {
      title: `${blogData.title} | 調整ちゃん`,
      description: `${blogData.title}に関する記事です。`,
      openGraph: {
          title: `${blogData.title} | 調整ちゃん`,
          description: `${blogData.title}に関する記事です。`,
      },
  };
}

// 記事詳細ページの生成
export default async function BlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // IDを取得
  const post = await getBlogPost(id);

  // dayjsを使ってpublishedAtをYY.MM.DD形式に変換
  const formattedDate = dayjs(post.publishedAt).format('YY.MM.DD');

  return (
    <main>
      <h1 className={styles.blogTitle}>{post.title}</h1> {/* タイトルを表示 */}
      <div>{formattedDate}</div> {/* 日付を表示 */}
      <div>カテゴリー：{post.category && post.category.name}</div> {/* カテゴリーを表示 */}
      <div dangerouslySetInnerHTML={{ __html: post.body }} /> {/* 記事本文を表示 */}
    </main>
  );
}

// 静的パスを生成
export async function generateStaticParams() {
  const contentIds = await client.getAllContentIds({ endpoint: 'blog' });

  return contentIds.map((contentId) => ({
    id: contentId, // 各記事のIDをパラメータとして返す
  }));
}