import { NextRequest } from 'next/server';
import { prisma } from '@/libs/prisma';
import { validateRequest } from '@/libs/security';

// PATCH: レストランの確定フラグを切り替えるAPI
export async function PATCH(request: NextRequest) {
  try {
    // リクエスト元の検証
    const validationError = validateRequest(request);
    if (validationError) {
      return validationError;
    }
    
    const body = await request.json();
    const { id, decisionFlag, eventId } = body;

    // バリデーション
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'レストランIDは必須です' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // レストランが存在するか確認
    const existingRestaurant = await prisma.restaurant.findUnique({
      where: { id }
    });

    if (!existingRestaurant) {
      return new Response(
        JSON.stringify({ error: '指定されたレストランが見つかりません' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // trueに設定する場合、同じイベントの他のレストランをfalseに設定
    if (decisionFlag && eventId) {
      await prisma.restaurant.updateMany({
        where: {
          eventId: eventId,
          id: { not: id },
          decisionFlag: true
        },
        data: {
          decisionFlag: false
        }
      });
    }

    // レストランの確定フラグを更新
    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: {
        decisionFlag: decisionFlag
      },
      include: {
        _count: {
          select: { votes: true }
        }
      }
    });

    return new Response(
      JSON.stringify(restaurant),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('レストラン確定フラグ更新エラー:', error);
    return new Response(
      JSON.stringify({ error: 'レストランの確定フラグ更新に失敗しました' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 