import { NextRequest, NextResponse } from "next/server";

// 許可するIPアドレスのリスト（/32は純粋なIPアドレスの表記なので除去）
const ALLOWED_IPS = ['113.43.200.98'];

/**
 * 許可されたドメインからのリクエストかどうかを確認する
 * @param request NextRequestオブジェクト
 * @returns 許可された場合はtrue、それ以外はfalse
 */
export function validateRequestOrigin(request: NextRequest): boolean {
  // リファラーヘッダーを取得
  const referer = request.headers.get('referer');
  
  // 許可されたドメインのリスト（開発環境も含む）
  const allowedDomains = [
    'https://www.atumaruchan.com',
    'https://atumaruchan.com',
    'https://shukketuchan.vercel.app',
    'http://localhost:3000'
  ];
  
  // リファラーが存在し、許可されたドメインのいずれかで始まるかチェック
  if (referer) {
    return allowedDomains.some(domain => referer.startsWith(domain));
  }
  
  // リファラーがない場合は拒否
  return false;
}

/**
 * オリジンヘッダーをチェックする（CORS対策）
 * @param request NextRequestオブジェクト
 * @returns 許可された場合はtrue、それ以外はfalse
 */
export function validateOriginHeader(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  
  // 許可されたドメインのリスト
  const allowedDomains = [
    'https://www.atumaruchan.com',
    'https://atumaruchan.com',
    'https://shukketuchan.vercel.app',
    'http://localhost:3000'
  ];
  
  // オリジンヘッダーがない場合（同一オリジンの場合もある）
  if (!origin) {
    return true;
  }
  
  return allowedDomains.includes(origin);
}

/**
 * クライアントのIPアドレスを取得する
 * @param request NextRequestオブジェクト
 * @returns IPアドレス文字列
 */
export function getClientIp(request: NextRequest): string {
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

/**
 * 許可されたIPアドレスかどうかを確認する
 * @param request NextRequestオブジェクト
 * @returns 許可された場合はtrue、それ以外はfalse
 */
export function validateIpAddress(request: NextRequest): boolean {
  // 開発環境の場合は常に許可
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  
  // クライアントIPの取得
  const ip = getClientIp(request);
  console.log("セキュリティチェック - クライアントIP:", ip);
  
  // IPが許可リストに含まれているかチェック
  return ALLOWED_IPS.includes(ip);
}

/**
 * リクエストを検証し、不正なリクエストの場合はエラーレスポンスを返す
 * @param request NextRequestオブジェクト
 * @returns エラーレスポンスまたはnull（検証通過）
 */
export function validateRequest(request: NextRequest): NextResponse | null {
  // POSTやPATCH、DELETEなどの変更を伴うリクエストのみ検証
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method)) {
    // リファラーとオリジンの両方をチェック
    const isValidReferer = validateRequestOrigin(request);
    const isValidOrigin = validateOriginHeader(request);
    
    // どちらかの検証に失敗した場合
    if (!isValidReferer || !isValidOrigin) {
      console.error(`不正アクセス検出: referer=${request.headers.get('referer')}, origin=${request.headers.get('origin')}`);
      
      return NextResponse.json(
        { error: 'アクセスが拒否されました。正規のWebサイトからアクセスしてください。' },
        { status: 403 }
      );
    }
  }
  
  // 検証通過
  return null;
}

/**
 * リクエストのIPアドレスを検証し、不正なIPの場合はエラーレスポンスを返す
 * @param request NextRequestオブジェクト
 * @returns エラーレスポンスまたはnull（検証通過）
 */
export function validateIpRequest(request: NextRequest): NextResponse | null {
  // IPアドレスをチェック
  const isValidIp = validateIpAddress(request);
  
  // 許可されていないIPからのアクセスの場合
  if (!isValidIp) {
    console.error(`IP制限によるアクセス拒否: IP=${getClientIp(request)}`);
    
    return NextResponse.json(
      { error: 'このリソースへのアクセス権限がありません。' },
      { status: 403 }
    );
  }
  
  // 検証通過
  return null;
}

/**
 * CSRFトークンを生成する
 * @returns CSRFトークン文字列
 */
export function generateCSRFToken(): string {
  // ランダムなトークンを生成
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  return Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
} 