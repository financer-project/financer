import { NextResponse } from "next/server"
import db from "@/src/lib/db"

export async function GET() {
    return NextResponse.json({
        status: "running",
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version,
        database: {
            status: await getDatabaseStatus()
        }
    })
}

async function getDatabaseStatus() {
    try {
        const result = await db.$executeRawUnsafe("SHOW TABLES;")
        if (result > 0) {
            return "running"
        } else {
            return "migration required"
        }
    } catch (error) {
        if (error instanceof Error && error.message.includes("Can't reach database server at")) {
            return "not running"
        }
    }
}