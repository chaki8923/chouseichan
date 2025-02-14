/*
  Warnings:

  - Made the column `isConfirmed` on table `Schedule` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "unique_confirmed_schedule";

-- AlterTable
ALTER TABLE "Schedule" ALTER COLUMN "isConfirmed" SET NOT NULL,
ALTER COLUMN "isConfirmed" SET DEFAULT false;
