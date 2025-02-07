import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { BASE_PATH, auth } from "@/auth";
import type { NextApiRequest, NextApiResponse } from "next";

declare module "next-auth" {
    interface Session {
      accessToken?: string;
    }
  }

export async function POST(req: NextApiRequest, res: NextApiResponse) {
  const session = await auth();
  console.log("カレンダーはった");
  

  if (!session?.accessToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // ✅ OAuth2 クライアントのセットアップ
  const oAuth2Client = new OAuth2Client();
  oAuth2Client.setCredentials({ access_token: session.accessToken });

  const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

  try {
    const event = {
      summary: "ミーティング",
      description: "重要な打ち合わせ",
      start: {
        dateTime: "2025-02-10T10:00:00+09:00",
        timeZone: "Asia/Tokyo",
      },
      end: {
        dateTime: "2025-02-10T11:00:00+09:00",
        timeZone: "Asia/Tokyo",
      },
    };

    // ✅ auth に OAuth2 クライアントを渡す
    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    });

    // ✅ response そのものにデータが含まれる
    res.status(200).json(response.data);
  } catch (error) {
    console.error("Google Calendar API Error:", error);
    res.status(500).json({ error: "Failed to create event" });
  }
}
