/*
  Warnings:

  - You are about to drop the column `isConfirmed` on the `Schedule` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "unique_confirmed_schedule";

-- AlterTable
ALTER TABLE "Schedule" DROP COLUMN "isConfirmed";
