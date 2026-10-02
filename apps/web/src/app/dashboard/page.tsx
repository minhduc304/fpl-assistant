import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"

export default async function Page() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/log-in")
  }
  redirect(`/dashboard/${user.fpl_team_id}`)
}
