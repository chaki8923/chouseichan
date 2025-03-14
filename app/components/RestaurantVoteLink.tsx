import Link from 'next/link';
import { Utensils } from 'lucide-react';
import styles from './RestaurantVoteLink.module.css';

interface RestaurantVoteLinkProps {
  eventId: string;
}

export default function RestaurantVoteLink({ eventId }: RestaurantVoteLinkProps) {
  if (!eventId) return null;
  
  return (
    <div className={styles.voteLinkContainer}>
      <Link href={`/restaurant-vote/${eventId}`} className={styles.voteLink}>
        <div className={styles.voteLinkInner}>
          <div className={styles.voteLinkIcon}>
            <Utensils size={22} />
          </div>
          <div className={styles.voteLinkContent}>
            <span className={styles.voteLinkTitle}>店舗投票</span>
            <span className={styles.voteLinkDescription}>みんなでお店を決めよう</span>
          </div>
          <div className={styles.voteLinkArrow}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </Link>
    </div>
  );
}