import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/libs/prisma";


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");

  if (!eventId) {
    return NextResponse.json(
      { error: "eventIdは必須です" },
      { status: 400 }
    );
  }

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        user: true, // イベントの作成者情報
        images: true,
        schedules: {
          orderBy: { id: "asc" },
          include: {
            responses: {
              orderBy: { user: { createdAt: "asc" } }, // userのupdatedAt順で
              include: {
                user: true, // 各回答者情報を取得
              },
            },
          },
        },
      },
    });
    if (!event) {
      return NextResponse.json(
        { error: "指定されたイベントが見つかりませんでした" },
        { status: 404 }
      );
    }

    return NextResponse.json(event, { status: 200 });
  } catch (error) {
    console.error("Error fetching event and schedules:", error);
    return NextResponse.json(
      { error: "イベント取得中にエラーが発生しました" },
      { status: 500 }
    );
  }
}

// イベントのタイトルとメモを更新するエンドポイント
export async function PATCH(request: NextRequest) {
    try {
        const { eventId, name, memo, iconPath } = await request.json();

        // バリデーション
        if (!eventId) {
            return new Response(JSON.stringify({ error: 'イベントIDが必要です' }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        }

        // イベントが存在するか確認
        const existingEvent = await prisma.event.findUnique({
            where: { id: eventId },
        });

        if (!existingEvent) {
            return new Response(JSON.stringify({ error: '指定されたイベントが見つかりませんでした' }), {
                status: 404,
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        }

        // イベントを更新
        const updatedEvent = await prisma.event.update({
            where: { id: eventId },
            data: {
                ...(name !== undefined && { name }),
                ...(memo !== undefined && { memo }),
                ...(iconPath !== undefined && { image: iconPath }),
            },
        });

        return new Response(JSON.stringify(updatedEvent), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        console.error('イベント更新エラー:', error);
        return new Response(JSON.stringify({ error: 'イベントの更新に失敗しました' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
}
