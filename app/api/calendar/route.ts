import { google } from "googleapis";
import { NextResponse } from "next/server";

// Google OAuth 認証設定
const oauth2Client = new google.auth.OAuth2({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: "http://localhost:3000/calendar",
});

// 📌 APIエンドポイント
export async function POST(req: Request) {
  
  try {
    const { accessToken,refreshToken, eventData } = await req.json();
    console.log("eventData", eventData);
    console.log("accessToken", accessToken);
    console.log("refreshToken", refreshToken);

    if (!accessToken) {
      return NextResponse.json({ error: "Access token is required" }, { status: 401 });
    }

    // Google OAuth2 クライアントを作成
    oauth2Client.setCredentials({ access_token: accessToken, refresh_token: refreshToken });

    // ✅ アクセストークンが無効なら自動更新
    await oauth2Client.getAccessToken();

    // Google カレンダー API のインスタンスを作成
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // 📌 イベントの作成
    const response = await calendar.events.insert({
      calendarId: "primary", // ユーザーのデフォルトカレンダー
      requestBody: {
        summary: eventData.title, // タイトル
        description: eventData.description, // 説明
        start: {
          dateTime: eventData.start, // 開始時刻（ISOフォーマット）
          timeZone: "Asia/Tokyo",
        },
        end: {
          dateTime: eventData.end, // 終了時刻
          timeZone: "Asia/Tokyo",
        },
      },
    });

    return NextResponse.json({ success: true, event: response.data });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
