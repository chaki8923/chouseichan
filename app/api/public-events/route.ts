import { NextResponse } from 'next/server';
import { prisma } from '@/libs/prisma';

export async function GET(request: Request) {
  try {
    // URLから検索パラメータを取得
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const query = searchParams.get('query');
    const eventIdsParam = searchParams.get('eventIds');
    
    // 訪問済みイベントIDの解析
    let visitedEventIds: string[] = [];
    if (eventIdsParam) {
      try {
        visitedEventIds = JSON.parse(eventIdsParam);
        if (!Array.isArray(visitedEventIds)) {
          visitedEventIds = [];
        }
      } catch (error) {
        console.error('Failed to parse eventIds:', error);
      }
    }
    
    // 訪問済みイベントIDがない場合は空の配列を返す
    // プライバシー保護のため、未訪問のイベントは表示しない
    if (visitedEventIds.length === 0) {
      return NextResponse.json({ events: [] });
    }
    
    // 検索フィルターの設定
    let dateFilter = {};
    
    // 年と月が指定されている場合、その月のイベントのみ取得
    if (year && month) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0); // 次の月の0日 = 今月の最終日
      
      dateFilter = {
        date: {
          gte: startDate,
          lte: endDate,
        },
      };
    }
    
    // Whereフィルターの準備
    let whereFilter: any = {};
    
    // 検索クエリがある場合、イベント名で検索
    if (query) {
      whereFilter.name = {
        contains: query,
        mode: 'insensitive', // 大文字小文字を区別しない
      };
    }
    
    // 訪問済みイベントIDがある場合、そのイベントのみに絞り込む
    // この条件は常に適用される（前の条件で早期リターンするため）
    whereFilter.id = {
      in: visitedEventIds
    };
    
    // イベントとスケジュールを取得
    const events = await prisma.event.findMany({
      include: {
        schedules: {
          where: dateFilter,
          include: {
            responses: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                  },
                },
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      where: whereFilter,
      orderBy: {
        updatedAt: 'desc',
      },
    });
    
    // 公開できる情報のみをフィルタリング
    const publicEvents = events.map(event => ({
      id: event.id,
      name: event.name,
      image: event.image,
      memo: event.memo,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      organizer: event.user,
      schedules: event.schedules.map(schedule => ({
        id: schedule.id,
        date: schedule.date,
        time: schedule.time,
        isConfirmed: schedule.isConfirmed,
        attendCount: schedule.responses.filter(res => res.response === 'ATTEND').length,
        totalResponses: schedule.responses.length,
      })),
    }));
    
    return NextResponse.json({ events: publicEvents });
  } catch (error) {
    console.error('イベント一覧の取得に失敗しました:', error);
    return NextResponse.json({ error: 'イベントの取得に失敗しました' }, { status: 500 });
  }
} 