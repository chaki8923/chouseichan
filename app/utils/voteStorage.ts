// LocalStorageで投票情報を管理するユーティリティ

// 投票情報の型
interface EventVote {
  eventId: string;
  restaurantId: string;
  timestamp: number;
}

// LocalStorageのキー
const VOTE_KEY = 'restaurant_votes';

// 現在のブラウザの匿名IDを取得（またはランダムに生成）
export function getAnonymousId(): string {
  if (typeof localStorage === 'undefined') return '';
  
  let id = localStorage.getItem('anonymous_id');
  if (!id) {
    id = `anon_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
    localStorage.setItem('anonymous_id', id);
  }
  return id;
}

// 投票情報をすべて取得
export function getAllVotes(): EventVote[] {
  if (typeof localStorage === 'undefined') return [];
  
  const votes = localStorage.getItem(VOTE_KEY);
  if (!votes) return [];
  
  try {
    return JSON.parse(votes) as EventVote[];
  } catch (error) {
    console.error('投票データの解析エラー:', error);
    return [];
  }
}

// 特定のイベントへの投票を取得
export function getEventVote(eventId: string): string | null {
  const votes = getAllVotes();
  const eventVote = votes.find(vote => vote.eventId === eventId);
  return eventVote ? eventVote.restaurantId : null;
}

// 投票済みかどうかを確認
export function hasVoted(eventId: string): boolean {
  return getEventVote(eventId) !== null;
}

// 投票を保存
export function saveVote(eventId: string, restaurantId: string): void {
  if (typeof localStorage === 'undefined') return;
  
  // 現在の投票情報を取得
  const votes = getAllVotes();
  
  // 同じイベントの以前の投票があれば削除
  const filteredVotes = votes.filter(vote => vote.eventId !== eventId);
  
  // 新しい投票を追加
  filteredVotes.push({
    eventId,
    restaurantId,
    timestamp: Date.now()
  });
  
  // 保存
  localStorage.setItem(VOTE_KEY, JSON.stringify(filteredVotes));
}

// 投票を削除
export function removeVote(eventId: string): void {
  if (typeof localStorage === 'undefined') return;
  
  const votes = getAllVotes();
  const filteredVotes = votes.filter(vote => vote.eventId !== eventId);
  
  localStorage.setItem(VOTE_KEY, JSON.stringify(filteredVotes));
} 