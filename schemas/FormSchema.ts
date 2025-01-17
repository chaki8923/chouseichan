import { z } from "zod";

// const allowedExtensions = ['jpg', 'jpeg', 'png'];

export const ScheduleSchema = z.object({
  event_name: z
    .string({
      required_error: "イベント名は必須です",
      invalid_type_error: "入力値に誤りがります",
    })
    .min(1, { message: "イベント名は必須です" })
    .max(30, { message: "イベント名は30文字以内で入力してください" }),
  memo: z
    .string()
    .max(300, { message: "メモは300文字以内で入力してください" }),
  schedules: z
    .array(
      z.object({
        date: z
          .string({ required_error: "日付は必須です" })
          .nonempty({ message: "日付は必須です" }), // 空文字を禁止
        time: z
          .string({ required_error: "時間は必須です" })
          .nonempty({ message: "時間は必須です" }), // 空文字を禁止
      }),
    )
    .min(1, { message: "スケジュールを1つ以上追加してください" }), // 最低1つは必要
  // image: z
  //   .any({ required_error: '必須項目です'})
  //   .refine((fileName) => {
  //     const extension = fileName.split('.').pop()?.toLowerCase(); // 拡張子を取得
  //     return extension ? allowedExtensions.includes(extension) : false; // 許可リストに含まれるかを確認
  //   }, {
  //     message: 'Invalid image file extension. Allowed extensions are: jpg, jpeg, png',
  //   })
});

export type ScheduleSchemaType = z.infer<typeof ScheduleSchema>;
