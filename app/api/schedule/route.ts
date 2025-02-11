import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";

export async function POST(request: NextRequest) {
    try {
      const { event_name, schedules, image, memo } = await request.json();
    
  
      // バリデーション
      if (!event_name || !schedules || schedules.length === 0) {
        return NextResponse.json(
          { error: "イベント名とスケジュールは必須です" },
          { status: 400 }
        );
      }
  
      // イベントとスケジュールの登録
      const newEvent = await prisma.event.create({
        data: {
          name: event_name, // イベント名
          image: image, // イベント画像（省略可能）
          memo: memo,
          schedules: {
            create: schedules.map((schedule: { date: string; time: string }) => ({
              date: new Date(schedule.date), // スケジュールの日付
              time: schedule.time, // スケジュールの時間
            })),
          },
        },
        include: {
          schedules: true, // 登録されたスケジュールも含めて返す
        },
      });      
  
      return NextResponse.json(newEvent, { status: 201 });
    } catch (error) {
      console.log("Error creating event and schedules:", error);
      return NextResponse.json(
        { error: "イベントとスケジュールの登録に失敗しました" },
        { status: 500 }
      );
    }
  }

  
async function getAllUser() {
  const user = await prisma.user.findMany();
  return user;
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