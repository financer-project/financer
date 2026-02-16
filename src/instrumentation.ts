export async function register() {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        const db = (await import("@/src/lib/db")).default
        const { seedDemoData } = await import("@/src/lib/db/seedDemoData")
        await seedDemoData(db)
    }
}
