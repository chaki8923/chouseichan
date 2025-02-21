import { auth } from "@/auth";
import EventDetails from "./presenter";


export default async function tracker() {
  const session = await auth();
  return (
    <>
      <EventDetails session={session} ></EventDetails>
    </>
  )
}