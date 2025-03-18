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
    
    // 前日の日付範囲を計算
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 前日作成されたイベントを取得
    const events = await prisma.event.findMany({
      where: {
        createdAt: {
          gte: yesterday,
          lt: today
        }
      },
      include: {
        schedules: true,
        _count: {
          select: {
            schedules: true
          }
        }
      }
    });
    
    if (events.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No events created yesterday'
      });
    }
    
    // 各イベントの回答数をカウント
    const eventsWithResponseCounts = await Promise.all(
      events.map(async (event) => {
        // このイベントのすべてのスケジュールIDを取得
        const scheduleIds = event.schedules.map(schedule => schedule.id);
        
        // これらのスケジュールに対する回答数をカウント
        const responsesCount = await prisma.response.count({
          where: {
            scheduleId: {
              in: scheduleIds
            }
          }
        });
        
        return {
          ...event,
          responsesCount
        };
      })
    );
    
    // メール本文の作成
    let emailContent = `
      <h2>昨日（${yesterday.toLocaleDateString('ja-JP')}）作成されたイベント一覧</h2>
      <p>合計: ${events.length}件</p>
      <hr />
    `;
    
    eventsWithResponseCounts.forEach((event, index) => {
      emailContent += `
        <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
          <h3>${index + 1}. ${event.name}</h3>
          <p><strong>ID:</strong> ${event.id}</p>
          <p><strong>作成日時:</strong> ${new Date(event.createdAt).toLocaleString('ja-JP')}</p>
          <p><strong>メモ:</strong> ${event.memo || '(なし)'}</p>
          <p><strong>スケジュール数:</strong> ${event._count.schedules}</p>
          <p><strong>回答者数:</strong> ${event.responsesCount}</p>
          <p><strong>リンク:</strong> https://www.chouseichan.com/event?eventId=${event.id}</p>
        </div>
      `;
    });
    
    // メール送信
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.REPORT_EMAIL_RECIPIENT,
      subject: `[調整ちゃん] 昨日作成されたイベント一覧（${yesterday.toLocaleDateString('ja-JP')}）`,
      html: emailContent
    };
    
    await transporter.sendMail(mailOptions);
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully sent daily report for ${events.length} events`
    });
    
  } catch (error) {
    console.error('Error in daily-event-report cron job:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to generate and send event report'
    }, { status: 500 });
  }
} 