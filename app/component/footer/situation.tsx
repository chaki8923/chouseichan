import Link from 'next/link';
import { client } from '@/libs/microcms';
import styles from "./index.module.scss";

// ブログ記事の型定義
type Props = {
  id: string;
  name: string;

};

// microCMSからブログ記事を取得
async function getBlogPosts(): Promise<Props[]> {
  const data = await client.get({
    endpoint: 'categories',
    queries: {
      fields: 'id,name',  // category.name を追加
      limit: 5,
      // filters: `category[equals]kouryukai`, // カテゴリーIDでフィルタ
    },
  });
  return data.contents;
}

export default async function Situation() {
  const categories = await getBlogPosts();
  
  return (
    <div className={styles.situationFooter}>
      <h3 className={styles.situationTitle}>調整ちゃんの利用シーン</h3>
      <ul className={styles.situationUl}>
        {categories.map((category) => (
          <li key={category.id} className={styles.blogList}>
            <Link href={`/situation?categoryId=${category.id}`} className={styles.blogLink}>
              {category.name || ''} {/* category が null の場合に対応 */}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
