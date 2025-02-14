type Schedule = {
  id: number;
  date: string; // ISO 8601 フォーマットの日付
  time: string;
  isConfirmed: boolean;
  responses: Response[]; // Response の配列として定義
};


export type Event = {
  id: string;
  name: string;
  image?: string;
  memo: string;
  schedules: Schedule[];
};
