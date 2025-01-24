/*
  Warnings:

  - A unique constraint covering the columns `[scheduleId,userId]` on the table `Response` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Response_scheduleId_userId_key" ON "Response"("scheduleId", "userId");
