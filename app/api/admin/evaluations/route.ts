import { NextRequest, NextResponse } from "next/server"
import { getAdminAuth } from "@/lib/firebase-admin"
import { getDatabase } from "firebase-admin/database"
import { getApps } from "firebase-admin/app"

export async function POST(request: NextRequest) {
    try {
        const { adminCpf, adminPassword } = await request.json()

        const adminCpfEnv = process.env.ADMIN_CPFS || process.env.ADMIN_CPF
        const envAdminPassword = process.env.ADMIN_PASSWORD

        if (!adminCpfEnv || !envAdminPassword) {
            return NextResponse.json(
                { error: "Admin credentials not configured" },
                { status: 500 }
            )
        }

        const adminCpfs = adminCpfEnv.split(",").map((c) => c.trim())
        const adminDigits = (adminCpf ?? "").replace(/\D/g, "")
        const expectedPassword = ["00000000000", "43736307802"].includes(adminDigits)
            ? (process.env.SUPER_ADMIN_PASSWORD || envAdminPassword)
            : envAdminPassword

        if (!adminCpfs.includes(adminDigits) || adminPassword !== expectedPassword) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        // Ensure admin app is initialized, then use Admin SDK to bypass client rules.
        getAdminAuth()
        const db = getDatabase(getApps()[0])
        const snapshot = await db.ref("avaliacoes").once("value")

        const evaluations = snapshot.exists() ? snapshot.val() : {}
        return NextResponse.json({ evaluations })
    } catch (error: any) {
        console.error("Error fetching evaluations:", error)
        return NextResponse.json(
            { error: "Internal server error: " + (error?.message ?? "Unknown") },
            { status: 500 }
        )
    }
}
