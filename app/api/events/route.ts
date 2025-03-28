import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/libs/prisma";
import { validateRequest } from "@/libs/security";


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    // キャッシュを無効化するためのタイムスタンプパラメータを取得
    const timestamp = searchParams.get('_t') || Date.now();

    if (!eventId) {
      return new Response(JSON.stringify({ error: 'イベントIDが必要です' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0' // キャッシュを無効化
        },
      });
    }

    const event = await prisma.event.findUnique({
        where: {
          id: eventId,
        },
        include: {
          schedules: {
            include: {
              responses: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      comment: true,
                      image: true,
                      main: true, // mainフラグを必ず含める
                    },
                  },
                },
                // ここで user の createdAt を desc に指定
                orderBy: {
                  user: {
                    createdAt: 'asc',
                  },
                },
              },
            },
            orderBy: {
              displayOrder: 'asc',
            },
          },
          images: true,
        },
      });
      

    if (!event) {
      return new Response(JSON.stringify({ error: '指定されたイベントが見つかりませんでした' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0' // キャッシュを無効化
        },
      });
    }

    return new Response(JSON.stringify(event), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0' // キャッシュを無効化
      },
    });
  } catch (error) {
    console.error('イベント取得エラー:', error);
    return new Response(JSON.stringify({ error: 'イベントの取得に失敗しました' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

// イベントのタイトル、メモ、アイコン、日程を更新するエンドポイント
export async function PATCH(request: NextRequest) {
  try {
    // リクエスト元の検証
    const validationError = validateRequest(request);
    if (validationError) {
      return validationError;
    }

    const body = await request.json();
    const { eventId, name, memo, iconPath, responseDeadline, schedules } = body;

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
      include: {
        schedules: {
          include: {
            responses: true
          }
        }
      }
    });

    if (!existingEvent) {
      return new Response(JSON.stringify({ error: '指定されたイベントが見つかりませんでした' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // トランザクションで一連の更新を行う
    const result = await prisma.$transaction(async (tx) => {
      // 1. イベント基本情報の更新
      const updatedEvent = await tx.event.update({
        where: { id: eventId },
        data: {
          ...(name !== undefined && { name }),
          ...(memo !== undefined && { memo }),
          ...(iconPath !== undefined && { image: iconPath }),
          ...(responseDeadline !== undefined && { responseDeadline: responseDeadline ? new Date(responseDeadline) : null }),
        },
      });

      // 2. スケジュールの更新があれば処理
      if (schedules) {
        // 2.1 既存スケジュールの更新
        if (schedules.update && schedules.update.length > 0) {
          for (const schedule of schedules.update) {
            // 更新対象のスケジュールを取得
            const existingSchedule = existingEvent.schedules.find(
              (s) => s.id === schedule.id
            );

            // スケジュールが存在する場合のみ処理
            if (existingSchedule) {
              // データを用意
              const updateData: any = {};
              
              // レスポンスがない場合のみ日付と時間を更新
              if (existingSchedule.responses.length === 0) {
                updateData.date = new Date(schedule.date);
                updateData.time = schedule.time;
              }
              
              // 表示順序が指定されていれば更新
              if (schedule.displayOrder !== undefined) {
                updateData.displayOrder = schedule.displayOrder;
              }
              
              // 更新するデータがあれば実行
              if (Object.keys(updateData).length > 0) {
                await tx.schedule.update({
                  where: { id: schedule.id },
                  data: updateData
                });
              }
            }
          }
        }

        // 2.2 スケジュールの削除
        if (schedules.delete && schedules.delete.length > 0) {
          for (const scheduleId of schedules.delete) {
            // 削除対象のスケジュールを取得
            const scheduleToDelete = existingEvent.schedules.find(
              (s) => s.id === scheduleId
            );

            // スケジュールが存在し、レスポンスがなければ削除
            if (scheduleToDelete && scheduleToDelete.responses.length === 0) {
              await tx.schedule.delete({
                where: { id: scheduleId },
              });
            }
          }
        }

        // 2.3 新規スケジュールの追加
        if (schedules.create && schedules.create.length > 0) {
          for (const newSchedule of schedules.create) {
            await tx.schedule.create({
              data: {
                eventId,
                date: new Date(newSchedule.date),
                time: newSchedule.time,
                isConfirmed: false,
                displayOrder: newSchedule.displayOrder || 0
              },
            });
          }
        }
      }

      // 最終的に更新されたイベント情報を取得して返却
      return await tx.event.findUnique({
        where: { id: eventId },
        include: {
          schedules: {
            include: {
              responses: {
                include: {
                  user: true
                }
              }
            },
            orderBy: {
              displayOrder: 'asc'
            }
          }
        },
      });
    });

    return new Response(JSON.stringify(result), {
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
        // リクエスト元の検証
        const validationError = validateRequest(request);
        if (validationError) {
            return validationError;
        }

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
