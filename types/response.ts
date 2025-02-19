import { User } from "./user";
// types.ts
export type Response = {
  response: "ATTEND" | "UNDECIDED" | "ABSENT";
  user: User
};
