import { NextRequest, NextResponse } from "next/server";

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
    'https://www.chouseichan.com',
    'https://chouseichan.com',
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
    'https://www.chouseichan.com',
    'https://chouseichan.com',
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