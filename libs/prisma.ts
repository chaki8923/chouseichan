// import { PrismaClient } from "@prisma/client/edge";
// import { withAccelerate } from "@prisma/extension-accelerate";

// const prismaClientSingleton = () => {
//   return new PrismaClient().$extends(withAccelerate());
// };

// declare const globalThis: {
//   prismaGlobal: ReturnType<typeof prismaClientSingleton>;
// } & typeof global;

// export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

// if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
// これより上を使用すればaccelerate

import { PrismaClient } from '@prisma/client';

// PrismaClientのグローバルインスタンスを定義
// 開発環境での多重インスタンス化を防ぐための対策
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

// 既存のインスタンスを使用するか、新しいインスタンスを作成
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// 開発環境でのみグローバルにインスタンスを設定
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
// 動かなくなったら上のコードを使用
// import { PrismaClient as PrismaClientEdge } from "@prisma/client/edge";
// import { withAccelerate } from "@prisma/extension-accelerate";
// import { PrismaClient as PrismaClientNormal } from "@prisma/client";

// // globalThis の型を拡張
// interface GlobalPrisma {
//   prismaGlobal?: ReturnType<typeof prismaClientSingleton>;
//   prisma?: PrismaClientNormal;
// }

// declare const globalThis: GlobalPrisma;

// const prismaClientSingleton = () => {
//   return new PrismaClientEdge().$extends(withAccelerate());
// };

// const getPrismaInstance = () => {
//   if (process.env.NODE_ENV === "production") {
//     globalThis.prismaGlobal = globalThis.prismaGlobal ?? prismaClientSingleton();
//     return globalThis.prismaGlobal;
//   } else {
//     globalThis.prisma = globalThis.prisma ?? new PrismaClientNormal();
//     return globalThis.prisma;
//   }
// };

// // `export` はトップレベルで行う
// export const prisma = getPrismaInstance();
