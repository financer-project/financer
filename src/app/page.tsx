import { invoke } from "./blitz-server"
import getCurrentUser from "./users/queries/getCurrentUser"
import { redirect } from "next/navigation"

export default async function Home() {
  const currentUser = await invoke(getCurrentUser, null)
  if (currentUser) {
    redirect("/dashboard")
  } else {
    return (
      <main>
        <p>Welcome to Financer.</p>
      </main>
    )
  }
}
