import { prisma } from "@/prisma"; // Prisma クライアントをインポート
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { user_name, schedules } = await request.json();

    console.log("user_name", user_name);
    console.log("schedules", schedules);
    

    // バリデーション
    if (!user_name || !schedules || schedules.length === 0) {
      return NextResponse.json(
        { error: "ユーザー名とレスポンスは必須です" },
        { status: 400 }
      );
    }

    // トランザクションでユーザーとレスポンスを作成
    const result = await prisma.$transaction(async (tx) => {
      // ユーザーを作成
      const newUser = await tx.user.create({
        data: {
          name: user_name
        },
      });

      // レスポンスを作成
      await tx.response.createMany({
        data: schedules.map((response: { id: number; response: string; comment?: string }) => ({
          userId: newUser.id,
          scheduleId: response.id,
          response: response.response, // enumの値をそのまま使用
        })),
      });

      return newUser;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating user and responses:", error);
    return NextResponse.json(
      { error: "ユーザーとレスポンスの作成に失敗しました" },
      { status: 500 }
    );
  }
}

export default async function UPADATE(request: NextRequest, res: NextResponse) {
  if (request.method === "PUT") {
    const { scheduleId, userId, response } = await request.json();

    try {
      // 対象のレスポンスを更新
      await prisma.response.upsert({
        where: {
          scheduleId_userId: {
            scheduleId,
            userId,
          },
        },
        update: { response }, // 更新
        create: { scheduleId, userId, response }, // 新規作成
      });

      res.status(200).json({ message: "Response updated successfully." });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to update response." });
    }
  } else {
    res.status(405).json({ message: "Method not allowed." });
  }
}