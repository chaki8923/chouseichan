import Link from 'next/link';
import { client } from '@/libs/microcms';
import styles from "./index.module.scss";

// カテゴリーの型定義
type Category = {
  id: string;
  name: string;
  description?: string;
  eyecatch?: {
    url: string;
    height: number;
    width: number;
  };
  categoryGroup?: string;
};

// microCMSからカテゴリーを取得
async function getCategories(): Promise<Category[]> {
  const data = await client.get({
    endpoint: 'categories',
    queries: {
      fields: 'id,name,description,eyecatch,categoryGroup',
      limit: 100, // カテゴリー数に応じて適切な数値に設定
    },
  });
  return data.contents;
}

export default async function Situation() {
  const categories = await getCategories();
  
  return (
    <div className={styles.situationFooter}>
      <div className={styles.situationContainer}>
        <h2 className={styles.situationMainTitle}>調整ちゃんの利用シーン</h2>
        <p className={styles.situationDescription}>
          様々なシーンで活用できる調整ちゃん。あなたのニーズに合わせてお選びください。
        </p>
        
        <div className={styles.categoryGrid}>
          {categories.map((category) => (
            <Link 
              key={category.id} 
              href={`/situation?categoryId=${category.id}`} 
              className={styles.categoryCard}
            >
              <div className={styles.categoryContent}>
                {category.eyecatch?.url ? (
                  <div className={styles.categoryIcon} style={{
                    backgroundImage: `url(${category.eyecatch.url})`
                  }} />
                ) : (
                  <div className={styles.categoryIconPlaceholder} />
                )}
                <div className={styles.categoryInfo}>
                  <h4 className={styles.categoryName}>{category.name}</h4>
                  {category.description && (
                    <p className={styles.categoryDescription}>
                      {category.description.length > 50
                        ? `${category.description.substring(0, 50)}...`
                        : category.description}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
