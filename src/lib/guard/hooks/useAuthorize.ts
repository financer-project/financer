import { useQuery } from "@blitzjs/rpc"
import authorizeAbility from "@/src/lib/guard/queries/authorizeAbility"
import type { Prisma } from "@prisma/client"

export type AbilityAction = "create" | "read" | "update" | "delete" | "manage" | "invite"

// Lightweight client hook to ask the server Guard if an action is authorized.
// Returns a boolean only (use useAuthorizeState if you need loading/error states).
export function useAuthorize(
    action: AbilityAction,
    resource: Prisma.ModelName,
    params?: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    useCurrentHousehold?: boolean
): boolean {
    const [allowed] = useQuery(authorizeAbility, { action, resource, params, useCurrentHousehold })
    return !!allowed
}

// Optional variant with state exposure for more advanced UIs
export function useAuthorizeState(
    action: AbilityAction,
    resource: Prisma.ModelName,
    params?: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    useCurrentHousehold?: boolean
) {
    const [allowed] = useQuery(authorizeAbility, { action, resource, params, useCurrentHousehold })
    return allowed
}
