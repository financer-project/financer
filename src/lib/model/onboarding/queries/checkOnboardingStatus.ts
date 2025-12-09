import { resolver } from "@blitzjs/rpc"
import db from "@/src/lib/db"

export default resolver.pipe(
    async () => {
        // Check the number of users in the system
        const userCount = await db.user.count()

        // If there are no users, onboarding is definitely needed
        if (userCount === 0) {
            return {
                needsOnboarding: true,
                reason: "no_users"
            }
        }

        // Check if onboarding has been completed in admin settings
        const adminSettings = await db.adminSettings.findFirst({
            select: {
                onboardingCompleted: true
            }
        })

        // If no admin settings exist or onboarding is not marked as completed
        const onboardingCompleted = adminSettings?.onboardingCompleted ?? false

        return {
            needsOnboarding: !onboardingCompleted,
            reason: onboardingCompleted ? "completed" : "not_completed",
            userCount
        }
    }
)