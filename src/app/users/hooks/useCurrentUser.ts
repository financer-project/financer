import { useQuery } from "@blitzjs/rpc"
import getCurrentUser from "../queries/getCurrentUser"
import { User } from "@prisma/client"

export const useCurrentUser = () => {
  const [user] = useQuery(getCurrentUser, null)
  if (!user) throw new Error("No user found")
  return user
}
