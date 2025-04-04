/**
 * アプリケーションのfeatureフラグ設定を管理するファイル
 */

// 環境変数からメンテナンスモードの設定を取得
// 環境変数が設定されていない場合はデフォルトで無効（false）
export const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';

// メンテナンス設定の詳細情報
export const maintenanceInfo = {
  // メンテナンススケジュール情報（環境変数またはデフォルト値）
  scheduledEndTime: process.env.NEXT_PUBLIC_MAINTENANCE_END_TIME || '未定',
  // メンテナンスの理由
  reason: process.env.NEXT_PUBLIC_MAINTENANCE_REASON || 'システムメンテナンス',
  // メンテナンス中の連絡先
  contact: process.env.NEXT_PUBLIC_MAINTENANCE_CONTACT || 'support@atumaruchan.com',
};

// 他の機能フラグもここに追加可能
export const featureFlags = {
  maintenanceMode: isMaintenanceMode,
  // 他の機能フラグ
  // exampleFeature: process.env.NEXT_PUBLIC_EXAMPLE_FEATURE === 'true',
};

/**
 * 特定の機能フラグが有効かどうかを確認する関数
 * @param featureName 機能フラグの名前
 * @returns boolean 機能が有効かどうか
 */
export function isFeatureEnabled(featureName: keyof typeof featureFlags): boolean {
  return featureFlags[featureName] || false;
} 