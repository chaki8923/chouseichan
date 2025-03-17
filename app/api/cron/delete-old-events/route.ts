import { NextResponse } from 'next/server';
import { prisma } from '../../../../libs/prisma';

export async function GET(request: Request) {
  try {
    // 6ヶ月前の日付を計算
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // 6ヶ月以上前のイベントを取得
    const oldEvents = await prisma.event.findMany({
      where: {
        createdAt: {
          lt: sixMonthsAgo
        }
      },
      include: {
        schedules: true,
        responses: true,
        images: true
      }
    });

    // 各イベントに対して削除処理を実行
    for (const event of oldEvents) {
      try {
        // 1. イベント画像を削除
        if (event.images && event.images.length > 0) {
          await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/event/images?eventId=${event.id}`, {
            method: 'DELETE'
          });
        }

        // 2. イベント自体を削除（関連するスケジュール、レスポンス、画像も自動的に削除される）
        await prisma.event.delete({
          where: {
            id: event.id
          }
        });

        console.log(`Deleted event: ${event.id}`);
      } catch (error) {
        console.error(`Error deleting event ${event.id}:`, error);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully processed ${oldEvents.length} old events` 
    });
  } catch (error) {
    console.error('Error in delete-old-events cron job:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process old events' 
    }, { status: 500 });
  }
} 