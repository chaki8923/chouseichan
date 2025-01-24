import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";


export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
      
    if (!eventId) {
      return NextResponse.json(
        { error: "eventIdは必須です" },
        { status: 400 }
      );
    }
  
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          schedules: {
            include: {
              responses: {
                select: {
                  id: true,
                  userId: true,
                  response: true,
                },
              },
            },
          },
        },
      });
  
      if (!event) {
        return NextResponse.json(
          { error: "指定されたイベントが見つかりませんでした" },
          { status: 404 }
        );
      }
  
      return NextResponse.json(event, { status: 200 });
    } catch (error) {
      console.error("Error fetching event and schedules:", error);
      return NextResponse.json(
        { error: "イベント取得中にエラーが発生しました" },
        { status: 500 }
      );
    }
  }