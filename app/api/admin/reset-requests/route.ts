import { NextRequest, NextResponse } from "next/server"
import { getAdminAuth } from "@/lib/firebase-admin"
import { getDatabase } from "firebase-admin/database"
import { getApps } from "firebase-admin/app"

export async function POST(request: NextRequest) {
    try {
        const { adminCpf, adminPassword } = await request.json()

        // Validate admin credentials server-side
        const envAdminCpf = process.env.ADMIN_CPF
        const envAdminPassword = process.env.ADMIN_PASSWORD

        if (!envAdminCpf || !envAdminPassword) {
            return NextResponse.json(
                { error: "Admin credentials not configured" },
                { status: 500 }
            )
        }

        const adminDigits = (adminCpf ?? "").replace(/\D/g, "")
        if (adminDigits !== envAdminCpf || adminPassword !== envAdminPassword) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        // Use Admin SDK to bypass security rules
        // Ensure admin app is initialized by calling getAdminAuth
        getAdminAuth()
        const db = getDatabase(getApps()[0])
        const snapshot = await db.ref("reset-requests").once("value")

        const cpfs: string[] = []
        if (snapshot.exists()) {
            const data = snapshot.val() as Record<string, unknown>
            cpfs.push(...Object.keys(data))
        }

        return NextResponse.json({ cpfs })
    } catch (error: any) {
        console.error("Error fetching reset requests:", error)
        return NextResponse.json(
            { error: "Internal server error: " + (error?.message ?? "Unknown") },
            { status: 500 }
        )
    }
}
