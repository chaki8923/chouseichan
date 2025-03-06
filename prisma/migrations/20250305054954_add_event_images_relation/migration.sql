-- AddForeignKey
ALTER TABLE "EventImages" ADD CONSTRAINT "EventImages_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
