import { NextResponse } from 'next/server';
import { prisma } from "@/libs/prisma";

// 日程推薦AIのロジック
const recommendOptimalDates = async (pastEvents: any[]) => {
  // 曜日ごとの参加率を分析
  const dayOfWeekStats: { [key: string]: { total: number, attended: number } } = {
    '0': { total: 0, attended: 0 }, // 日曜日
    '1': { total: 0, attended: 0 }, // 月曜日
    '2': { total: 0, attended: 0 }, // 火曜日
    '3': { total: 0, attended: 0 }, // 水曜日
    '4': { total: 0, attended: 0 }, // 木曜日
    '5': { total: 0, attended: 0 }, // 金曜日
    '6': { total: 0, attended: 0 }, // 土曜日
  };

  // 時間帯ごとの参加率を分析
  const timeStats: { [key: string]: { total: number, attended: number } } = {};
  
  // 参加率データを集計
  pastEvents.forEach(event => {
    event.schedules.forEach((schedule: any) => {
      const date = new Date(schedule.date);
      const dayOfWeek = date.getDay().toString();
      const hour = schedule.time.split(':')[0];
      
      if (!timeStats[hour]) {
        timeStats[hour] = { total: 0, attended: 0 };
      }
      
      // 総数をカウント
      dayOfWeekStats[dayOfWeek].total += schedule.responses.length;
      timeStats[hour].total += schedule.responses.length;
      
      // 参加者数をカウント
      const attendedCount = schedule.responses.filter(
        (r: any) => r.response === 'ATTEND'
      ).length;
      
      dayOfWeekStats[dayOfWeek].attended += attendedCount;
      timeStats[hour].attended += attendedCount;
    });
  });
  
  // 参加率を計算
  const dayOfWeekRates = Object.entries(dayOfWeekStats).map(([day, stats]) => ({
    day: parseInt(day),
    rate: stats.total > 0 ? stats.attended / stats.total : 0
  }));
  
  const timeRates = Object.entries(timeStats).map(([hour, stats]) => ({
    hour: parseInt(hour),
    rate: stats.total > 0 ? stats.attended / stats.total : 0
  }));
  
  // 参加率が高い順にソート
  dayOfWeekRates.sort((a, b) => b.rate - a.rate);
  timeRates.sort((a, b) => b.rate - a.rate);
  
  // 現在の日付から2週間分の日付を生成
  const today = new Date();
  const recommendedDates = [];
  
  // 参加率上位3つの曜日を取得
  const topDays = dayOfWeekRates.slice(0, 3).map(d => d.day);
  // 参加率上位2つの時間帯を取得
  const topHours = timeRates.slice(0, 2).map(t => t.hour);
  
  // 今後2週間で最適な日程を生成
  for (let i = 0; i < 14; i++) {
    const date = new Date();
    date.setDate(today.getDate() + i);
    
    // トップの曜日に一致する日を選択
    if (topDays.includes(date.getDay())) {
      for (const hour of topHours) {
        const formattedHour = hour.toString().padStart(2, '0');
        
        // 祝日チェックロジックをここに追加可能
        
        recommendedDates.push({
          date: date.toISOString().split('T')[0],
          time: `${formattedHour}:00`,
          confidence: calculateConfidence(dayOfWeekRates, timeRates, date.getDay(), hour)
        });
      }
    }
  }
  
  // 推薦度の高い順に並べ替え
  recommendedDates.sort((a, b) => b.confidence - a.confidence);
  
  return recommendedDates.slice(0, 5); // 上位5件を返す
}

// 推薦日時の信頼度を計算する関数
const calculateConfidence = (
  dayRates: {day: number, rate: number}[], 
  timeRates: {hour: number, rate: number}[],
  day: number,
  hour: number
): number => {
  const dayRate = dayRates.find(d => d.day === day)?.rate || 0;
  const timeRate = timeRates.find(t => t.hour === hour)?.rate || 0;
  
  // 曜日と時間の参加率を組み合わせて信頼度を計算
  return 0.6 * dayRate + 0.4 * timeRate;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    // userIdが存在する場合は過去のイベントデータに基づいて推薦
    if (userId) {
      try {
        // ユーザーの過去のイベントを取得
        const userEvents = await prisma.event.findMany({
          where: {
            userId: userId
          },
          include: {
            schedules: {
              include: {
                responses: true
              }
            }
          }
        });

        // イベントがある場合は過去データに基づいて推薦
        if (userEvents.length > 0) {
          const recommendedDates = await recommendOptimalDates(userEvents);
          return NextResponse.json({ recommendations: recommendedDates });
        }
      } catch (error) {
        console.error('ユーザーイベント取得エラー:', error);
        // エラーが発生してもデフォルト推薦を返す（続行）
      }
    }

    // userIdがない場合、またはイベントがない場合はデフォルトの推奨日程を返す
    const defaultRecommendations = generateDefaultRecommendations();
    return NextResponse.json({ 
      recommendations: defaultRecommendations,
      isDefault: true 
    });
  } catch (error) {
    console.error('日程推薦エラー:', error);
    return NextResponse.json(
      { error: '日程推薦の取得中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

// デフォルトの推奨日程を生成
function generateDefaultRecommendations() {
  const recommendations = [];
  const today = new Date();
  
  // 今後2週間の金曜日と土曜日を探す
  for (let i = 0; i < 14; i++) {
    const date = new Date();
    date.setDate(today.getDate() + i);
    const day = date.getDay();
    
    // 金曜日(5)と土曜日(6)
    if (day === 5 || day === 6) {
      const formattedDate = date.toISOString().split('T')[0];
      
      // 夕方と夜の時間帯
      recommendations.push({
        date: formattedDate,
        time: "19:00",
        confidence: day === 5 ? 0.85 : 0.9 // 土曜日の方が若干信頼度高め
      });
      
      recommendations.push({
        date: formattedDate,
        time: "18:00",
        confidence: day === 5 ? 0.8 : 0.85
      });
    }
  }
  
  // 平日のランチタイムも追加（会社関連の予定などに便利）
  for (let i = 0; i < 14; i++) {
    const date = new Date();
    date.setDate(today.getDate() + i);
    const day = date.getDay();
    
    // 月曜日(1)から金曜日(5)まで
    if (day >= 1 && day <= 5) {
      const formattedDate = date.toISOString().split('T')[0];
      
      // ランチタイム
      recommendations.push({
        date: formattedDate,
        time: "12:00",
        confidence: 0.75
      });
    }
  }
  
  // 信頼度順にソート
  recommendations.sort((a, b) => b.confidence - a.confidence);
  
  return recommendations.slice(0, 5); // 上位5件を返す
} 