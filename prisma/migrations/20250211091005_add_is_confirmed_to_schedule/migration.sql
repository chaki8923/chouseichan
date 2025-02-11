/*
  Warnings:

  - A unique constraint covering the columns `[eventId,isConfirmed]` on the table `Schedule` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Schedule" ADD COLUMN     "isConfirmed" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "unique_confirmed_schedule" ON "Schedule"("eventId", "isConfirmed");
