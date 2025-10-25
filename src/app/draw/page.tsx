import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";

export default async function DrawPage() {
  const user = await currentUser();

  if (!user) {
    // Redirect to sign in if not authenticated
    redirect("/");
  }

  // Redirect to user-specific draw page
  redirect(`/draw/${user.id}`);
}
