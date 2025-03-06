/*
  Warnings:

  - You are about to drop the `EventImages` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "EventImages" DROP CONSTRAINT "EventImages_eventId_fkey";

-- DropTable
DROP TABLE "EventImages";

-- CreateTable
CREATE TABLE "EventImage" (
    "id" SERIAL NOT NULL,
    "imagePath" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,

    CONSTRAINT "EventImage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EventImage" ADD CONSTRAINT "EventImage_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
