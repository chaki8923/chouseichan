import { NextResponse } from 'next/server';
import { prisma } from '../../../../libs/prisma';
import nodemailer from 'nodemailer';
import { S3Client, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

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

// Cloudflare R2クライアントの設定
const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

// 画像URLからオブジェクトキーを抽出する関数
function extractObjectKey(url: string): string | null {
  if (!url) return null;
  
  try {
    console.log('画像URL:', url);
    
    // R2のドメイン部分を取得
    const domain = process.env.R2_PUBLIC_BUCKET_DOMAIN;
    if (!domain || !url.startsWith(domain)) {
      console.log('R2ドメインに一致しないURL:', url);
      return null;
    }
    
    // ドメイン部分を削除してキーを取得
    const key = url.substring(domain.length + 1); // +1 で先頭の/も削除
    console.log('抽出されたオブジェクトキー:', key);
    return key;
  } catch (error) {
    console.error('オブジェクトキーの抽出に失敗:', error);
    return null;
  }
}

export async function GET(request: Request) {
  try {
    // 認証キーの検証（セキュリティ対策）
    // 1. クエリパラメータから認証キーを取得
    const { searchParams } = new URL(request.url);
    const authKey = searchParams.get('authKey');
    
    // 2. Authorizationヘッダーから認証キーを取得（Vercel cronジョブ用）
    const authHeader = request.headers.get('authorization');
    const headerToken = authHeader ? authHeader.replace('Bearer ', '') : null;
    
    // いずれかの方法で認証が成功すればOK
    const isAuthorized = 
      authKey === process.env.CRON_SECRET || 
      headerToken === process.env.CRON_SECRET;
    
    if (!isAuthorized) {
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
          console.log(`イベントID: ${event.id} の画像 ${event.images.length}件 を削除開始`);
          for (const image of event.images) {
            try {
              // URLを取得
              const imageUrl = `${process.env.R2_PUBLIC_BUCKET_DOMAIN}/${image.imagePath}`;
              console.log(`画像パス: ${image.imagePath}`);
              const objectKey = extractObjectKey(imageUrl);
              if (objectKey) {
                console.log(`R2オブジェクトキー: ${objectKey} を削除します`);
                const command = new DeleteObjectCommand({
                  Bucket: process.env.R2_PUBLIC_BUCKET_NAME,
                  Key: objectKey
                });
                await s3Client.send(command);
                console.log(`R2オブジェクト削除完了: ${objectKey}`);
              } else {
                console.log(`オブジェクトキーの抽出に失敗: ${imageUrl}`);
              }
            } catch (error) {
              console.error(`画像削除エラー (imageId: ${image.id}):`, error);
              // エラーがあっても処理を継続
            }
          }
        }
        
        // 1b. イベントアイコンを削除
        if (event.image && event.image !== '/logo.png') {
          try {
            console.log(`イベントID: ${event.id} のアイコン削除開始`);
            const objectKey = extractObjectKey(event.image);
            if (objectKey) {
              console.log(`イベントアイコンのオブジェクトキー: ${objectKey} を削除します`);
              const command = new DeleteObjectCommand({
                Bucket: process.env.R2_PUBLIC_BUCKET_NAME,
                Key: objectKey
              });
              await s3Client.send(command);
              console.log(`イベントアイコン削除完了: ${objectKey}`);
            }
          } catch (error) {
            console.error(`イベントアイコン削除エラー (eventId: ${event.id}):`, error);
            // エラーがあっても処理を継続
          }
        }
        
        // 1c. レストラン画像を削除
        try {
          // イベントに関連するレストランを取得
          const restaurants = await prisma.restaurant.findMany({
            where: { eventId: event.id },
            select: { id: true, imageUrl: true }
          });
          
          if (restaurants && restaurants.length > 0) {
            console.log(`イベントID: ${event.id} のレストラン画像 ${restaurants.length}件 を削除開始`);
            
            for (const restaurant of restaurants) {
              if (restaurant.imageUrl) {
                try {
                  const objectKey = extractObjectKey(restaurant.imageUrl);
                  if (objectKey) {
                    console.log(`レストラン画像のオブジェクトキー: ${objectKey} を削除します`);
                    const command = new DeleteObjectCommand({
                      Bucket: process.env.R2_PUBLIC_BUCKET_NAME,
                      Key: objectKey
                    });
                    await s3Client.send(command);
                    console.log(`レストラン画像削除完了: ${objectKey}`);
                  }
                } catch (error) {
                  console.error(`レストラン画像削除エラー (restaurantId: ${restaurant.id}):`, error);
                  // エラーがあっても処理を継続
                }
              }
            }
            
            // レストラン画像フォルダを検索して残りの画像も削除
            try {
              // restaurant-images/[eventId] フォルダをリストアップ
              const prefix = `restaurant-images/${event.id}/`;
              console.log(`レストラン画像フォルダを検索: ${prefix}`);
              
              const listCommand = new ListObjectsV2Command({
                Bucket: process.env.R2_PUBLIC_BUCKET_NAME,
                Prefix: prefix
              });
              
              const listResult = await s3Client.send(listCommand);
              
              if (listResult.Contents && listResult.Contents.length > 0) {
                console.log(`フォルダ内に ${listResult.Contents.length}件 の画像が見つかりました`);
                
                for (const object of listResult.Contents) {
                  if (object.Key) {
                    try {
                      console.log(`フォルダ内画像を削除: ${object.Key}`);
                      const deleteCommand = new DeleteObjectCommand({
                        Bucket: process.env.R2_PUBLIC_BUCKET_NAME,
                        Key: object.Key
                      });
                      await s3Client.send(deleteCommand);
                    } catch (error) {
                      console.error(`フォルダ内画像削除エラー: ${object.Key}`, error);
                      // エラーがあっても処理を継続
                    }
                  }
                }
              } else {
                console.log(`フォルダ内に削除すべき画像はありませんでした: ${prefix}`);
              }
            } catch (error) {
              console.error(`レストラン画像フォルダ検索エラー (eventId: ${event.id}):`, error);
              // エラーがあっても処理を継続
            }
          }
        } catch (error) {
          console.error(`レストラン情報取得エラー (eventId: ${event.id}):`, error);
          // エラーがあっても処理を継続
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