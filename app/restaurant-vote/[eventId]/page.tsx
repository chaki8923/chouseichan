import { Metadata } from 'next';
import { prisma } from '@/libs/prisma';
import RestaurantVoteContent from './RestaurantVoteContent';

type Props = {
  params: { eventId: string }
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { eventId } = params;

        // イベント情報を取得
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { name: true }
  });

  const title = event ? `${event.name}のお店投票 | あつ丸ちゃん` : 'お店投票 | あつ丸ちゃん';
  const description = 'お店投票ページです。候補のお店に投票したり、新しいお店を提案したりできます。';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: '/logo.png',
          width: 1200,
          height: 630,
          alt: 'あつ丸ちゃん - お店投票',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/logo.png'],
    },
  };
}

export default function RestaurantVotePage({ params }: Props) {
  return <RestaurantVoteContent params={params} />;
} 