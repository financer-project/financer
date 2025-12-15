import { resolver } from "@blitzjs/rpc"
import db from "@/src/lib/db"
import Guard from "@/src/lib/guard/ability"
import { AddOrInviteHouseholdMemberSchema } from "@/src/lib/model/household/schemas"
import { AuthorizationError } from "blitz"
import { HouseholdRole } from "@prisma/client"
import { notificationMailer } from "@/src/lib/mailers/notificationMailer"
import { invitationMailer } from "@/src/lib/mailers/invitationMailer"
import { generateToken, hash256 } from "@blitzjs/auth"
import { performAddHouseholdMember } from "./addHouseholdMember"

export default resolver.pipe(
    resolver.zod(AddOrInviteHouseholdMemberSchema),
    resolver.authorize(),
    Guard.authorizePipe("invite", "Household"),
    async ({ id, email, role, accessLevel }, ctx) => {
        const household = await db.household.findFirst({ where: { id } })
        if (!household) throw new Error("Household not found")

        const normalizedEmail = email.toLowerCase()
        const user = await db.user.findFirst({ where: { email: normalizedEmail } })

        // Ensure there is only one OWNER per household
        if (role === HouseholdRole.OWNER) {
            const ownerCount = await db.householdMembership.count({ where: { householdId: id, role: HouseholdRole.OWNER } })
            if (ownerCount > 0) {
                throw new AuthorizationError("This household already has an owner.")
            }
        }

        // If user exists → add membership (if not already a member) and send notification
        if (user) {
            const existing = await db.householdMembership.findFirst({ where: { userId: user.id, householdId: id } })
            if (!existing) {
                await performAddHouseholdMember({ householdId: id, userId: user.id, role, accessLevel })
            }

            await notificationMailer({
                to: user.email,
                title: existing ? "Household update" : "You were added to a household",
                message: existing
                    ? `You have been (re)added or your permissions were updated for household "${household.name}".`
                    : `You have been added to the household "${household.name}".\n                Role: ${role}. Access: ${accessLevel}.`,
                link: {
                    href: `${process.env.APP_ORIGIN ?? process.env.BLITZ_DEV_SERVER_ORIGIN}/households/${id}`,
                    text: existing ? "Open household" : "View household"
                }
            }).send()

            // return the membership (new or existing)
            return existing ?? (await db.householdMembership.findFirst({ where: { userId: user.id, householdId: id } }))
        }

        // If user does NOT exist → send invitation first and then a general notification
        // Build inviter name from current session user
        const inviter = await db.user.findFirst({ where: { id: ctx.session.userId }, select: { firstName: true, lastName: true } })
        const inviterName = inviter ? `${inviter.firstName ?? ""} ${inviter.lastName ?? ""}`.trim() || "A user" : "A user"

        // Get admin settings for token expiration
        const adminSettings = (await db.adminSettings.findFirst())!
        const tokenExpirationHours = adminSettings?.invitationTokenExpirationHours ?? 72

        const token = generateToken()
        const hashedToken = hash256(token)
        const expiresAt = new Date()
        expiresAt.setHours(expiresAt.getHours() + tokenExpirationHours)

        // Remove any existing household invitation tokens for this email
        await db.token.deleteMany({ where: { type: "INVITATION_HOUSEHOLD", sentTo: normalizedEmail } })
        // Save new token with household content
        await db.token.create({
            data: {
                userId: ctx.session.userId,
                sentTo: normalizedEmail,
                type: "INVITATION_HOUSEHOLD",
                hashedToken,
                expiresAt,
                content: {
                    householdId: id,
                    role,
                    accessLevel
                } as any
            }
        })

        // Send invitation email
        await invitationMailer({ to: normalizedEmail, token, inviterName }).send()

        // Send follow-up generic notification
        await notificationMailer({
            to: normalizedEmail,
            title: "Household invitation",
            message: `${inviterName} invited you to join the household "${household.name}". Please check your inbox for the invitation link to create your account.`
        }).send()

        // No membership created yet (user does not exist). Return a neutral response.
        return { invited: true }
    }
)
