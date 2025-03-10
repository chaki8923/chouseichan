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

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get("eventId");

        if (!eventId) {
            return new Response(
                JSON.stringify({ error: "eventId は必須です" }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        console.log(`削除リクエスト受信: eventId=${eventId}`);

        // イベントが存在するか確認
        const existingEvent = await prisma.event.findUnique({
            where: { id: eventId },
            include: {
                schedules: {
                    include: {
                        responses: true
                    }
                },
                images: true
            }
        });

        if (!existingEvent) {
            console.log(`イベントが見つかりません: eventId=${eventId}`);
            return new Response(
                JSON.stringify({ error: "指定されたイベントが見つかりませんでした" }),
                {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        console.log(`イベント確認: ${existingEvent.name} (ID: ${existingEvent.id})`);
        console.log(`スケジュール数: ${existingEvent.schedules.length}`);
        console.log(`画像数: ${existingEvent.images.length}`);

        // トランザクションで関連レコードを順番に削除
        await prisma.$transaction(async (tx) => {
            // 1. 関連するレスポンスを削除
            for (const schedule of existingEvent.schedules) {
                if (schedule.responses.length > 0) {
                    console.log(`スケジュールID: ${schedule.id}の回答を削除中...`);
                    await tx.response.deleteMany({
                        where: { scheduleId: schedule.id }
                    });
                }
            }

            // 2. スケジュールを削除
            if (existingEvent.schedules.length > 0) {
                console.log(`イベントのスケジュールを削除中...`);
                await tx.schedule.deleteMany({
                    where: { eventId: eventId }
                });
            }

            // 3. 画像を削除
            if (existingEvent.images.length > 0) {
                console.log(`イベントの画像レコードを削除中...`);
                await tx.eventImage.deleteMany({
                    where: { eventId: eventId }
                });
            }

            // 4. 最後にイベント自体を削除
            console.log(`イベント自体を削除中...`);
            await tx.event.delete({
                where: { id: eventId }
            });
        });

        console.log(`イベント削除完了: ${eventId}`);
        return new Response(
            JSON.stringify({ success: true, message: "イベントが正常に削除されました" }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }
        );

    } catch (error: any) {
        // エラーオブジェクトを安全に処理
        const errorMessage = error?.message || "不明なエラー";
        console.error(`イベント削除エラー: ${errorMessage}`);
        console.error(error);
        
        // エラーレスポンスを返す
        return new Response(
            JSON.stringify({ 
                error: "イベントの削除に失敗しました", 
                details: errorMessage 
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
}
