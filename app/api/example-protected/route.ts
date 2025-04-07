import { NextRequest, NextResponse } from "next/server";
import { validateIpRequest, getClientIp } from "@/libs/security";

export async function GET(request: NextRequest) {
  try {
    // IP制限による検証
    const ipError = validateIpRequest(request);
    if (ipError) {
      return ipError;
    }

    // ここから保護されたリソースのロジック
    return NextResponse.json({
      message: "このAPIは特定のIPからのみアクセス可能です",
      clientIp: getClientIp(request),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("保護されたAPIエラー:", error);
    return NextResponse.json(
      { error: "内部サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // IP制限による検証
    const ipError = validateIpRequest(request);
    if (ipError) {
      return ipError;
    }

    // リクエストボディの取得
    const body = await request.json();

    // ここから保護されたリソースのロジック
    return NextResponse.json({
      message: "データを受け取りました",
      receivedData: body,
      clientIp: getClientIp(request),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("保護されたAPI POSTエラー:", error);
    return NextResponse.json(
      { error: "内部サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
} 