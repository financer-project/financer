import { NextResponse } from "next/server"

export async function GET() {
    return NextResponse.json({
        demoData: process.env.DEMO_DATA === "true",
    })
}
