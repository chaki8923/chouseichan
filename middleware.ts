import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 許可するIPアドレスのリスト（/32は純粋なIPアドレスの表記なので除去）
const ALLOWED_IPS = ['113.43.200.98','124.36.24.122'];

// IPアドレスが許可リストに含まれているかチェック
function isIpAllowed(ip: string): boolean {
  // 完全一致で確認
  return ALLOWED_IPS.includes(ip);
}

// IPアドレスを取得する関数
function getClientIp(request: NextRequest): string {
  console.log("request headers>>>>>>>", Object.fromEntries(request.headers.entries()));
  
  // X-Forwarded-For ヘッダーからIPを取得（プロキシ経由の場合）
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // カンマで区切られた場合は最初のIPを使用
    return forwardedFor.split(',')[0].trim();
  }
  
  // 直接接続の場合（ローカル環境など）
  const remoteAddr = request.headers.get('x-real-ip');
  if (remoteAddr) {
    return remoteAddr.trim();
  }

  // Cloudflare特有のヘッダー
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }
  
  // IPが取得できない場合
  return '';
}

export function middleware(request: NextRequest) {
  // クライアントIPの取得
  const ip = getClientIp(request);
  console.log("クライアントIP>>>>>>>>>>>>", ip);
  
  // 開発環境の場合はスキップ
  if (process.env.NODE_ENV === 'development') {
    console.log("開発環境のため、IP制限をスキップします");
    return NextResponse.next();
  }
  
  // 許可されたIPでない場合は403を返す
  if (!isIpAllowed(ip)) {
    console.log(`アクセス拒否: ${ip} - 許可IPリスト: ${ALLOWED_IPS.join(', ')}`);
    return new NextResponse(
      JSON.stringify({ error: 'アクセスが拒否されました(IBJAPAN_A、IBJNETでのみアクセスできます)' }),
      { 
        status: 403, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
  
  // 許可されたIPの場合は通常通り処理を続行
  console.log(`アクセス許可: ${ip}`);
  return NextResponse.next();
}

// どのパスに対してミドルウェアを適用するか設定
export const config = {
  // 全てのパスに適用する場合
  matcher: '/:path*',
  
  // 特定のパスにのみ適用したい場合の例
  // matcher: ['/admin/:path*', '/api/:path*']
}; 