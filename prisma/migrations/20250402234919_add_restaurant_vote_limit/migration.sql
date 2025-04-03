-- CreateTable
CREATE TABLE "RestaurantVoteLimit" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RestaurantVoteLimit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantVoteLimit_eventId_key" ON "RestaurantVoteLimit"("eventId");

-- AddForeignKey
ALTER TABLE "RestaurantVoteLimit" ADD CONSTRAINT "RestaurantVoteLimit_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
