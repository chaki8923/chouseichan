import { prisma } from "@/libs/prisma"; // Prisma クライアントをインポート
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/libs/security";

export async function POST(request: NextRequest) {
  try {
    // リクエスト元の検証
    const validationError = validateRequest(request);
    if (validationError) {
      return validationError;
    }
    
    const { user_name, schedules, comment } = await request.json();
    // バリデーション
    if (!user_name || !schedules || schedules.length === 0) {
      return NextResponse.json(
        { error: "ユーザー名とレスポンスは必須です" },
        { status: 400 }
      );
    }

    // トランザクションでユーザーとレスポンスを作成
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {

      // ユーザーを作成
      const newUser = await tx.user.create({
        data: {
          name: user_name,
          comment: comment
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

export async function PUT(request: NextRequest) {
  try {
    // リクエスト元の検証
    const validationError = validateRequest(request);
    if (validationError) {
      return validationError;
    }
    
    const { userId, user_name, schedules, comment } = await request.json();

    if (!userId || !schedules || schedules.length === 0) {
      return NextResponse.json(
        { error: "ユーザーIDとレスポンスは必須です" },
        { status: 400 }
      );
    }

    // トランザクションでレスポンスを更新
    const updatedResponses = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {


      // ユーザー名を更新
      await tx.user.update({
        where: { id: userId },
        data: { name: user_name, comment: comment },
      });

      // 既存のレスポンスを削除してから新しいレスポンスを作成
      await tx.response.deleteMany({
        where: { userId },
      });

      const newResponses = await tx.response.createMany({
        data: schedules.map((response: { id: number; response: string; comment?: string }) => ({
          userId,
          scheduleId: response.id,
          response: response.response
        })),
      });

      return newResponses;
    });

    return NextResponse.json({ success: true, updatedResponses }, { status: 200 });
  } catch (error) {
    console.error("Error updating responses:", error);
    return NextResponse.json(
      { error: "レスポンスの更新に失敗しました" },
      { status: 500 }
    );
  }
}