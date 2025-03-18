import { NextResponse } from 'next/server';
import { prisma } from '../../../../libs/prisma';
import nodemailer from 'nodemailer';

// メール送信用のトランスポーター設定
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD
    }
  });
};

export async function GET(request: Request) {
  try {
    // 認証キーの検証（セキュリティ対策）
    const { searchParams } = new URL(request.url);
    const authKey = searchParams.get('authKey');
    
    if (authKey !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // 6ヶ月前の日付を計算
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // 6ヶ月以上前のイベントを取得
    const oldEvents = await prisma.event.findMany({
      where: {
        createdAt: {
          lt: sixMonthsAgo
        }
      },
      include: {
        schedules: true,
        images: true
      }
    });

    // 削除結果を保存する配列
    const deletedEvents = [];

    // 各イベントに対して削除処理を実行
    for (const event of oldEvents) {
      try {
        // 削除結果に追加
        deletedEvents.push({
          id: event.id,
          name: event.name,
          createdAt: event.createdAt
        });

        // 1. イベント画像を削除
        if (event.images && event.images.length > 0) {
          await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/event/images?eventId=${event.id}`, {
            method: 'DELETE'
          });
        }

        // 2. 各スケジュールに対する回答を削除
        for (const schedule of event.schedules) {
          await prisma.response.deleteMany({
            where: {
              scheduleId: schedule.id
            }
          });
        }

        // 3. イベントのスケジュールを削除
        await prisma.schedule.deleteMany({
          where: {
            eventId: event.id
          }
        });

        // 4. イベントのレストラン候補を削除
        await prisma.restaurant.deleteMany({
          where: {
            eventId: event.id
          }
        });

        // 5. イベント画像データを削除
        await prisma.eventImage.deleteMany({
          where: {
            eventId: event.id
          }
        });

        // 6. イベント自体を削除
        await prisma.event.delete({
          where: {
            id: event.id
          }
        });

        console.log(`Deleted event: ${event.id}`);
      } catch (error) {
        console.error(`Error deleting event ${event.id}:`, error);
      }
    }

    // 削除したイベントがある場合はメールで通知
    if (deletedEvents.length > 0) {
      try {
        // メール本文の作成
        const currentDate = new Date().toLocaleDateString('ja-JP');
        let emailContent = `
          <h2>古いイベント削除レポート（${currentDate}）</h2>
          <p>6ヶ月以上前に作成された${deletedEvents.length}件のイベントを削除しました。</p>
          <hr />
        `;

        deletedEvents.forEach((event, index) => {
          emailContent += `
            <div style="margin-bottom: 15px; padding: 10px; border: 1px solid #eee; border-radius: 5px;">
              <h3>${index + 1}. ${event.name}</h3>
              <p><strong>ID:</strong> ${event.id}</p>
              <p><strong>作成日時:</strong> ${new Date(event.createdAt).toLocaleString('ja-JP')}</p>
               <p><strong>リンク:</strong> https://www.chouseichan.com/event?eventId=${event.id}</p>
            </div>
          `;
        });

        // メール送信
        const transporter = createTransporter();
        
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: process.env.REPORT_EMAIL_RECIPIENT,
          subject: `[調整ちゃん] 古いイベント削除レポート（${currentDate}）`,
          html: emailContent
        };
        
        await transporter.sendMail(mailOptions);
        console.log('Deletion report email sent successfully');

      } catch (emailError) {
        console.error('Error sending deletion report email:', emailError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully processed ${oldEvents.length} old events` 
    });
  } catch (error) {
    console.error('Error in delete-old-events cron job:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process old events' 
    }, { status: 500 });
  }
} 