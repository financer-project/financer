import { Queue, Worker } from "bullmq"
import { Redis } from "ioredis"
import { processImport } from "../model/imports/services/importProcessor"

// Create a Redis connection
const connection = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: null,
    lazyConnect: process.env.NODE_ENV === "test"
})

// Create a queue for import jobs
export const importQueue = new Queue("import-queue", { connection })

// Create a worker to process import jobs
export const importWorker = new Worker("import-queue", async job => {
    const { importJobId } = job.data
    await processImport(importJobId)
}, { connection })

// Handle worker events
importWorker.on("completed", job => {
    console.log(`Job ${job.id} completed for import ${job.data.importJobId}`)
})

importWorker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed for import ${job?.data.importJobId}:`, err)
})

// Function to add a job to the queue
export async function queueImportJob(importJobId: string): Promise<void> {
    await importQueue.add("process-import", { importJobId })
}
