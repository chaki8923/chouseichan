import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";
// import { Prisma } from "@prisma/client";
import { prisma } from "@/libs/prisma";

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get("content-type")?.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Content-Type must be multipart/form-data" },
        { status: 400 },
      );
    }

    // const formData = await request.formData();
    const formData = await request.formData();

    const event_name = formData.get("event_name") as string;
    const schedules = JSON.parse(formData.get("schedules") as string);
    const memo = formData.get("memo") as string;
    const imageFile = formData.get("image") as File | null;
    let uploadedUrl = null;

    if (imageFile) {
      // 拡張子を取得
      const extension = imageFile.name.split(".").pop() || "jpg"; // デフォルトで "jpg"

      // File をバッファに変換
      const arrayBuffer = await imageFile.arrayBuffer();
      const imageBuffer = Buffer.from(arrayBuffer);

      console.log(" process.env.R2_ENDPOINT",  process.env.R2_ENDPOINT);
      console.log(" process.env.R2_ACCESS_KEY",  process.env.R2_ACCESS_KEY);
      console.log(" process.env.R2_SECRET_KEY",  process.env.R2_SECRET_KEY);
      

      // S3 にアップロード
      const s3 = new S3Client({
        region: "auto",
        endpoint: process.env.R2_ENDPOINT!,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY!,
          secretAccessKey: process.env.R2_SECRET_KEY!,
        },
      });

      const key = `images/${Date.now()}.${extension}`;

      await s3.send(
        new PutObjectCommand({
          Bucket: "chousei",
          Key: key,
          ContentType: imageFile.type, // FileオブジェクトからMIMEタイプを取得
          Body: imageBuffer,
          ACL: "public-read",
        }),
      );


      uploadedUrl = `${process.env.R2_ENDPOINT}/chousei/${key}`;
    }

    // トランザクションで処理を一括管理
    const result = await prisma.$transaction(async (prisma) => {
      const newEvent = await prisma.event.create({
        data: {
          name: event_name,
          image: uploadedUrl,
          memo: memo,
        },
      });

      await prisma.schedule.createMany({
        data: schedules.map((schedule: { date: string; time: string }) => ({
          eventId: newEvent.id,
          date: new Date(schedule.date),
          time: schedule.time,
          isConfirmed: false,
        })),
      });

      return await prisma.event.findUnique({
        where: { id: newEvent.id },
        include: { schedules: true },
      });
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating event and schedules:", error);
    return NextResponse.json(
      { error: "イベントとスケジュールの登録に失敗しました" },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const { scheduleId, eventId } = await req.json();

    if (scheduleId === undefined || scheduleId === null || !eventId) {
      return NextResponse.json(
        { error: "scheduleId と eventId は必須です" },
        { status: 400 },
      );
    }

    // ✅ 既存の「決定済み」スケジュールをリセット（isConfirmed を false にする）
    await prisma.schedule.updateMany({
      where: { eventId },
      data: { isConfirmed: false },
    });

    if (scheduleId === 0) {
      return NextResponse.json({ success: true, schedule: "キャンセル" });
    }
    // ✅ 指定したスケジュールを「決定済み」にする
    const updatedSchedule = await prisma.schedule.update({
      where: { id: scheduleId },
      data: { isConfirmed: true },
    });

    return NextResponse.json({ success: true, schedule: updatedSchedule });
  } catch (error) {
    console.error("Error confirming schedule:", error);
    return NextResponse.json(
      { error: "スケジュールの更新に失敗しました" },
      { status: 500 },
    );
  }
}
