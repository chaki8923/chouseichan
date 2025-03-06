import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/libs/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { eventId } = req.query;

  if (!eventId || typeof eventId !== 'string') {
    return res.status(400).json({ error: 'Invalid eventId' });
  }

  try {
    const images = await prisma.eventImage.findMany({
      where: { eventId },
      select: { imagePath: true },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.status(200).json(images.map((image: { imagePath: string }) => image.imagePath));
  } catch (error) {
    console.error('Error fetching event images:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}