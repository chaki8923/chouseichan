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
  response: z
    .string()
    .max(300, { message: "メモは300文字以内で入力してください" }),
  schedules: z
    .array(
      z.object({
        id: z
          .number({ required_error: "日付は必須です" }),
        response: z.string({
          required_error: "名は必須です",
          invalid_type_error: "入力値に誤りがります",
        })
      }),
    )
  // image: z
  //   .any({ required_error: '必須項目です'})
  //   .refine((fileName) => {
  //     const extension = fileName.split('.').pop()?.toLowerCase(); // 拡張子を取得
  //     return extension ? allowedExtensions.includes(extension) : false; // 許可リストに含まれるかを確認
  //   }, {
  //     message: 'Invalid image file extension. Allowed extensions are: jpg, jpeg, png',
  //   })
});

export type UserResponseSchemaType = z.infer<typeof UserResponseSchema>;
