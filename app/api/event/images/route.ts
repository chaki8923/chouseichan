import { NextResponse } from 'next/server';
import { prisma } from '@/libs/prisma';

export async function GET(request: Request) {
  // URLからeventIdを取得
  const url = new URL(request.url);
  const eventId = url.searchParams.get('eventId');

  if (!eventId) {
    return NextResponse.json({ error: 'Invalid eventId' }, { status: 400 });
  }

  try {
    const images = await prisma.eventImage.findMany({
      where: { eventId },
      select: { id: true, imagePath: true },
    });

    return NextResponse.json(images);
  } catch (error) {
    console.error('Error fetching event images:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}