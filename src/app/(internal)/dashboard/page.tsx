import { BlitzPage } from "@blitzjs/auth"
import { invoke } from "../../blitz-server"
import getCurrentUser from "../../users/queries/getCurrentUser"

export const dynamic = "force-dynamic"

const Dashboard: BlitzPage = async () => {
  const currentUser = await invoke(getCurrentUser, null)
  return (
    <main className={"w-full h-full flex flex-col "}>
      <h1>Hi, {currentUser?.firstName}</h1>
      <p>Welcome to your new Blitz app.</p>
    </main>
  )
}

export default Dashboard
