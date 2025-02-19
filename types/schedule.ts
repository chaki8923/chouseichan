import { Response } from "./response"; // ✅ ここで統一

export type Schedule = {
  id: number;
  responses: Response[];
  date: string;
  time: string;
  isConfirmed: boolean;

};
