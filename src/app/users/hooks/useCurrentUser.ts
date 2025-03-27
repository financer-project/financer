import { useQuery } from "@blitzjs/rpc"
import getCurrentUser from "@/src/lib/model/auth/queries/getCurrentUser"

export const useCurrentUser = () => {
  const [user] = useQuery(getCurrentUser, null)
  if (!user) throw new Error("No user found")
  return user
}
