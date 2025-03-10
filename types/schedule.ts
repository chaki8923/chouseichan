import { Response } from "./response"; // ✅ ここで統一

export type Schedule = {
  id: number;
  responses: Response[];
  date: string;
  time: string;
  isConfirmed: boolean;
  displayOrder?: number; // 表示順序を管理するフィールド（オプショナル）
};
