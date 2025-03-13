export type User = {
  id: string;
  name: string;
  response: string;
  comment?: string; // コメントはオプショナル
  main?:  bigint;
};
