export type Response = {
  id: number;
  userId: number;
  scheduleId: number;
  response: "ATTEND" | "UNDECIDED" | "DECLINE"; // 必須: 値の種類をリテラル型で指定
  comment?: string; // コメントはオプショナル
  createdAt: string; // DateTime 型は文字列で扱われる
  updatedAt: string;
};
