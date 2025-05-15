import { importWorker } from "./index"

// This file is loaded on the server side only
console.log("Initializing background job workers...")

// Make sure the worker is initialized
if (importWorker) {
    console.log("Import worker initialized")
}

// Handle process shutdown
process.on("SIGTERM", async () => {
    console.log("Closing background job workers...")
    await importWorker.close()
    console.log("Background job workers closed")
})