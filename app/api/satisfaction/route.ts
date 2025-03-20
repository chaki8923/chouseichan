import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { eventId, rating, comment } = data;

    // 入力検証
    if (!eventId) {
      return NextResponse.json({ error: 'イベントIDが必要です' }, { status: 400 });
    }

    if (rating === undefined || rating < 1 || rating > 5) {
      return NextResponse.json({ error: '評価は1から5の間である必要があります' }, { status: 400 });
    }

    // データベースに保存
    const satisfaction = await prisma.satisfactionTable.create({
      data: {
        eventId,
        rating,
        comment: comment || null,
      },
    });

    return NextResponse.json({ success: true, data: satisfaction }, { status: 200 });
  } catch (error) {
    console.error('Satisfaction survey submission error:', error);
    return NextResponse.json({ error: 'アンケートの送信に失敗しました' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json({ error: 'イベントIDが必要です' }, { status: 400 });
    }

    // イベントIDに関連付けられた満足度データを取得
    const satisfactionData = await prisma.satisfactionTable.findMany({
      where: {
        eventId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ satisfactionData }, { status: 200 });
  } catch (error) {
    console.error('Satisfaction data fetch error:', error);
    return NextResponse.json({ error: 'アンケートデータの取得に失敗しました' }, { status: 500 });
  }
} 