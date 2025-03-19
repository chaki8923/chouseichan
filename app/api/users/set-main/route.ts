import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/libs/prisma';
import { validateRequest } from '@/libs/security';

export async function POST(request: NextRequest) {
  try {
    // リクエスト元の検証
    const validationError = validateRequest(request);
    if (validationError) {
      return validationError;
    }
    
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

    return NextResponse.json({
      success: true,
      isMain: updatedUser.main,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        main: updatedUser.main
      }
    });
  } catch (error) {
    console.error('主役設定エラー:', error);
    return NextResponse.json({ error: '主役の設定に失敗しました' }, { status: 500 });
  }
} 