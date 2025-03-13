import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/libs/prisma';

export async function POST(request: NextRequest) {
  try {
    const { userId, eventId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'ユーザーIDが必要です' }, { status: 400 });
    }

    // 指定されたユーザーの現在の状態を取得
    const currentUser = await prisma.user.findUnique({
      where: {
        id: userId
      }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // メインフラグを反転（トグル）
    const updatedUser = await prisma.user.update({
      where: {
        id: userId
      },
      data: {
        main: !currentUser.main // 現在の値を反転
      }
    });

    const message = updatedUser.main 
      ? `${updatedUser.name}さんをメイン担当者に設定しました`
      : `${updatedUser.name}さんのメイン担当者設定を解除しました`;

    return NextResponse.json({
      success: true,
      message: message,
      isMain: updatedUser.main,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        main: updatedUser.main
      }
    });
  } catch (error) {
    console.error('メイン担当者設定エラー:', error);
    return NextResponse.json({ error: 'メイン担当者の設定に失敗しました' }, { status: 500 });
  }
} 