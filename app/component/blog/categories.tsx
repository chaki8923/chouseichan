'use client'
import Link from 'next/link';
import { getBlogPosts } from '@/app/utils/getBlogPosts';
import styles from "./index.module.scss";

type Blog = {
  id: string;
  title: string;
  category: {
    id: string;
    name: string;
  } | null;
};

// `categoryId` を props で受け取る
export default async function Category({ categoryId }: { categoryId: string }) {
  // getBlogPosts を Server Component 内で直接呼び出す（OK）
  const posts = await getBlogPosts(categoryId);
  console.log("posts", posts);

  return (
    <div>
      <ul>
        {posts.map((post: Blog) => (
          <li key={post.id} className={styles.blogList}>
            <Link 
              href={post.category?.id ? `/?categoryId=${post.category.id}` : '/'} 
              className={styles.blogLink}
            >
              {post.category?.name || 'カテゴリなし'} {/* カテゴリー名を表示 */}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
