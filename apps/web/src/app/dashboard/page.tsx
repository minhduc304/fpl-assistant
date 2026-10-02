import { redirect } from "next/navigation"

const DEMO_TEAM_ID = 1234567

export default function Page() {
  redirect(`/dashboard/${DEMO_TEAM_ID}`)
}
