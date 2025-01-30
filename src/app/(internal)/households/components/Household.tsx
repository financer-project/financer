"use client"
import { useMutation, useQuery } from "@blitzjs/rpc"
import Link from "next/link"
import { useRouter } from "next/navigation"
import deleteHousehold from "../mutations/deleteHousehold"
import getHousehold from "../queries/getHousehold"

export const Household = ({ householdId }: { householdId: number }) => {
  const router = useRouter()
  const [deleteHouseholdMutation] = useMutation(deleteHousehold)
  const [household] = useQuery(getHousehold, { id: householdId })

  return (
    <>
      <div>
        <h1>Project {household.id}</h1>
        <pre>{JSON.stringify(household, null, 2)}</pre>

        <Link href={`/households/${household.id}/edit`}>Edit</Link>

        <button
          type="button"
          onClick={async () => {
            if (window.confirm("This will be deleted")) {
              await deleteHouseholdMutation({ id: household.id })
              router.push("/households")
            }
          }}
          style={{ marginLeft: "0.5rem" }}
        >
          Delete
        </button>
      </div>
    </>
  )
}
