import { Prisma } from "@prisma/client"

/**
 * Minimal user select for createdBy relations.
 * Avoids over-fetching while providing necessary data for UserAvatar.
 */
export const createdByUserSelect = {
    id: true,
    firstName: true,
    lastName: true,
    avatarPath: true
} satisfies Prisma.UserSelect

export type CreatedByUser = Prisma.UserGetPayload<{
    select: typeof createdByUserSelect
}>
