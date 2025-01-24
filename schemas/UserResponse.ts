import { z } from "zod";

// const allowedExtensions = ['jpg', 'jpeg', 'png'];

export const UserResponseSchema = z.object({
  user_name: z
    .string({
      required_error: "名は必須です",
      invalid_type_error: "入力値に誤りがります",
    })
    .min(1, { message: "名は必須です" })
    .max(30, { message: "名は30文字以内で入力してください" }),
  schedules: z
    .array(
      z.object({
        id: z
          .number({ required_error: "日付は必須です" })
          .min(1, { message: "日付は必須です" }), // 空文字を禁止
        response: z
          .string({ required_error: "時間は必須です" })
          .min(1, { message: "時間は必須です" }), // 空文字を禁止
      }),
    )
    .min(1, { message: "スケジュールを1つ以上追加してください" }), // 最低1つは必要
});

export type UserResponseSchemaType = z.infer<typeof UserResponseSchema>;
