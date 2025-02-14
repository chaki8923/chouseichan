type User = {
  id: number;
  name: string;
  comment?: string; // コメントはオプショナル
  createdAt: string; // DateTime 型は文字列で扱われる
  updatedAt: string;
};



type Response = {
    id: number;
    userId: number;
    scheduleId: number;
    response: "ATTEND" | "UNDECIDED" | "ABSENT"; // 必須: 値の種類をリテラル型で指定
    comment?: string; // コメントはオプショナル
    createdAt: string; // DateTime 型は文字列で扱われる
    updatedAt: string;
    user: User;
  };
  

export type Schedule = {
  id: number;
  date: string; // ISO 8601 フォーマットの日付
  time: string;
  isConfirmed: boolean;
  responses: Response[]; // Response の配列として定義
};
