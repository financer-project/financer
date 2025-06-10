import { NextResponse } from "next/server"

// Import the job initialization file
import "@/src/lib/jobs/init.server"

// This route doesn't need to do anything, it's just to ensure the job initialization file is loaded
export async function GET() {
  return NextResponse.json({ status: 'Background job workers initialized' });
}