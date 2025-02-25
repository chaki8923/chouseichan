// import { PrismaClient } from "@prisma/client/edge";
// import { withAccelerate } from "@prisma/extension-accelerate";

// const prismaClientSingleton = () => {
//   return new PrismaClient().$extends(withAccelerate());
// };

// declare const globalThis: {
//   prismaGlobal: ReturnType<typeof prismaClientSingleton>;
// } & typeof global;
// これより上を使用すればaccelerate

// export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

// if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;

// import { PrismaClient } from "@prisma/client";

// const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// export const prisma = globalForPrisma.prisma ?? new PrismaClient();

// if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
// 動かなくなったら上のコードを使用
import { PrismaClient as PrismaClientEdge } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { PrismaClient as PrismaClientNormal } from "@prisma/client";

// globalThis の型を拡張
interface GlobalPrisma {
  prismaGlobal?: ReturnType<typeof prismaClientSingleton>;
  prisma?: PrismaClientNormal;
}

declare const globalThis: GlobalPrisma;

const prismaClientSingleton = () => {
  return new PrismaClientEdge().$extends(withAccelerate());
};

const getPrismaInstance = () => {
  if (process.env.NODE_ENV === "production") {
    globalThis.prismaGlobal = globalThis.prismaGlobal ?? prismaClientSingleton();
    return globalThis.prismaGlobal;
  } else {
    globalThis.prisma = globalThis.prisma ?? new PrismaClientNormal();
    return globalThis.prisma;
  }
};

// `export` はトップレベルで行う
export const prisma = getPrismaInstance();
