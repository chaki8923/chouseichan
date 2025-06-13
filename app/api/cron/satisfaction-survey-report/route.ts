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
    
    const authHeader = request.headers.get('authorization');
    const headerToken = authHeader ? authHeader.replace('Bearer ', '') : null;
    
    const isAuthorized = 
      authKey === process.env.CRON_SECRET || 
      headerToken === process.env.CRON_SECRET;
    
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // 前日の日付範囲を計算（日本時間基準）
    const now = new Date();
    
    // JSTでの昨日の0時0分0秒を取得
    const yesterday = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() - 1,
        -9, // JST = UTC+9 なので、UTC時間では-9時がJSTの0時
        0,
        0,
        0
      )
    );
    
    // JSTでの今日の0時0分0秒を取得
    const today = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        -9, // JST = UTC+9 なので、UTC時間では-9時がJSTの0時
        0, 
        0,
        0
      )
    );

    console.log("今日のJST午前0時（UTC基準）:", today.toISOString());
    console.log("昨日のJST午前0時（UTC基準）:", yesterday.toISOString());
    
    // 前日送信された満足度調査結果を取得
    const satisfactionSurveys = await prisma.satisfactionTable.findMany({
      where: {
        createdAt: {
          gte: yesterday,
          lt: today
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log("昨日の満足度調査>>>>>>>>>>>>>>>>>>>>>", satisfactionSurveys);
    
    // 集計データの準備
    const totalSurveys = satisfactionSurveys.length;
    let averageRating = 0;
    const ratingDistribution: Record<string, number> = {
      '5': 0,
      '4': 0,
      '3': 0,
      '2': 0,
      '1': 0
    };
    
    if (totalSurveys > 0) {
      // 平均評価を計算
      const totalRating = satisfactionSurveys.reduce((sum, survey) => sum + survey.rating, 0);
      averageRating = totalRating / totalSurveys;
      
      // 評価分布を計算
      satisfactionSurveys.forEach(survey => {
        const key = survey.rating.toString() as keyof typeof ratingDistribution;
        ratingDistribution[key] += 1;
      });
    }
    
    // メール本文の作成
    let emailContent = `
      <h2>昨日（${yesterday.toLocaleDateString('ja-JP')}）の満足度調査結果</h2>
      <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
    `;
    
    if (totalSurveys === 0) {
      emailContent += `
        <p style="font-size: 16px; color: #666;">昨日は満足度調査の回答がありませんでした。</p>
      `;
    } else {
      // 集計結果の表示
      emailContent += `
        <p><strong>回答数:</strong> ${totalSurveys}件</p>
        <p><strong>平均評価:</strong> ${averageRating.toFixed(2)} / 5.00</p>
        
        <h3>評価分布</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr style="background-color: #f2f2f2;">
            <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">評価</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">回答数</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">割合</th>
          </tr>
      `;
      
      // 評価ごとの分布を表示
      for (let rating = 5; rating >= 1; rating--) {
        const key = rating.toString() as keyof typeof ratingDistribution;
        const count = ratingDistribution[key];
        const percentage = (count / totalSurveys * 100).toFixed(1);
        
        emailContent += `
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">★${rating}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${count}件</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${percentage}%</td>
          </tr>
        `;
      }
      
      emailContent += `
        </table>
        
        <h3>詳細一覧</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background-color: #f2f2f2;">
            <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">ID</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">イベントID</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">評価</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">コメント</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">送信日時</th>
          </tr>
      `;
      
      // 個別のフィードバック一覧
      satisfactionSurveys.forEach(survey => {
        emailContent += `
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">${survey.id}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">
              <a href="https://www.atumaruchan.com/event?eventId=${survey.eventId}" target="_blank">
                ${survey.eventId}
              </a>
            </td>
            <td style="padding: 8px; border: 1px solid #ddd;">★${survey.rating}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${survey.comment || '(コメントなし)'}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${new Date(survey.createdAt).toLocaleString('ja-JP')}</td>
          </tr>
        `;
      });
      
      emailContent += `
        </table>
      `;
    }
    
    emailContent += `
      </div>
    `;
    
    // メール送信
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.REPORT_EMAIL_RECIPIENT,
      subject: `[調整ちゃん] 昨日の満足度調査結果（${yesterday.toLocaleDateString('ja-JP')}）`,
      html: emailContent
    };
    
    await transporter.sendMail(mailOptions);
    console.log('満足度調査レポートのメールを送信しました');
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully sent satisfaction survey report with ${satisfactionSurveys.length} responses`
    });
    
  } catch (error) {
    console.error('Error in satisfaction-survey-report cron job:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to generate and send satisfaction survey report'
    }, { status: 500 });
  }
} 