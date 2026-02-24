import { importWorker, registerTransactionTemplatesJob, timeToCron, transactionTemplatesWorker } from "./index"
import db from "@/src/lib/db"

// This file is loaded on the server side only
console.log("Initializing background job workers...")

// Make sure the workers are initialized
if (importWorker) {
    console.log("Import worker initialized")
}

if (transactionTemplatesWorker) {
    console.log("Transaction templates worker initialized")
}

// Register transaction templates cron job from admin settings
async function initTransactionTemplatesJob() {
    try {
        const settings = await db.adminSettings.findUnique({ where: { id: 1 } })
        const cronTime = settings?.transactionTemplateCronTime ?? "00:00"
        await registerTransactionTemplatesJob(timeToCron(cronTime))
        console.log(`Transaction templates cron job registered at ${cronTime}`)
    } catch (err) {
        console.error("Failed to register transaction templates cron job:", err)
    }
}

await initTransactionTemplatesJob()

// Handle process shutdown
process.on("SIGTERM", async () => {
    console.log("Closing background job workers...")
    await importWorker.close()
    await transactionTemplatesWorker.close()
    console.log("Background job workers closed")
})