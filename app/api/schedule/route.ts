import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body) {
      return NextResponse.json(
        { error: "リクエストボディが不正です" },
        { status: 400 }
      );
    }

    const { event_name, schedules, image, memo } = body;

    console.log("schedules>>>>>>>", schedules);
    console.log("event_name>>>>>>>", event_name);

    // バリデーション
    if (!event_name || !schedules || schedules.length === 0) {
      return NextResponse.json(
        { error: "イベント名とスケジュールは必須です" },
        { status: 400 }
      );
    }

    // トランザクションで処理を一括管理
    const result = await prisma.$transaction(async (prisma) => {
      // ① Event を作成
      const newEvent = await prisma.event.create({
        data: {
          name: event_name, // イベント名
          image: image, // イベント画像（省略可能）
          memo: memo,
        },
      });

      console.log("newEvent>>>>>>>", newEvent.id);

      // ② 取得した event の id を Schedule に渡して一括作成
      await prisma.schedule.createMany({
        data: schedules.map((schedule: { date: string; time: string;}) => ({
          eventId: newEvent.id, // Event の ID を明示的に設定
          date: new Date(schedule.date), // 日付
          time: schedule.time, // 時間
          isConfirmed: false, // デフォルト false
        })),
      });

      // ③ 作成したイベントを `schedules` を含めて取得
      return await prisma.event.findUnique({
        where: { id: newEvent.id },
        include: { schedules: true },
      });
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.log("Error creating event and schedules:", error);
    return NextResponse.json(
      { error: "イベントとスケジュールの登録に失敗しました" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const { scheduleId, eventId } = await req.json();

    if (!scheduleId || !eventId) {
      return NextResponse.json({ error: "scheduleId と eventId は必須です" }, { status: 400 });
    }

    // ✅ 既存の「決定済み」スケジュールをリセット（isConfirmed を false にする）
    await prisma.schedule.updateMany({
      where: { eventId },
      data: { isConfirmed: false },
    });

    // ✅ 指定したスケジュールを「決定済み」にする
    const updatedSchedule = await prisma.schedule.update({
      where: { id: scheduleId },
      data: { isConfirmed: true },
    });

    return NextResponse.json({ success: true, schedule: updatedSchedule });
  } catch (error) {
    console.error("Error confirming schedule:", error);
    return NextResponse.json({ error: "スケジュールの更新に失敗しました" }, { status: 500 });
  }
}