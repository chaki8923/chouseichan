import Link from 'next/link';
import { Utensils } from 'lucide-react';
import styles from './RestaurantVoteLink.module.css';

interface RestaurantVoteLinkProps {
  eventId: string;
}

export default function RestaurantVoteLink({ eventId }: RestaurantVoteLinkProps) {
  if (!eventId) return null;
  
  return (
    <Link href={`/restaurant-vote/${eventId}`} className={styles.voteLink}>
      <Utensils size={18} />
      <span className={styles.voteLinkText}>店舗投票</span>
    </Link>
  );
}