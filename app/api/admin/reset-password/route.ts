import { NextRequest, NextResponse } from "next/server"
import { getAdminAuth } from "@/lib/firebase-admin"

export async function POST(request: NextRequest) {
    try {
        const { cpf, adminCpf, adminPassword } = await request.json()

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

        if (!cpf) {
            return NextResponse.json(
                { error: "CPF is required" },
                { status: 400 }
            )
        }

        const email = `${cpf}@donzelord.app`

        // Step 1: Delete the Firebase Auth user
        try {
            const auth = getAdminAuth()
            const userRecord = await auth.getUserByEmail(email)
            await auth.deleteUser(userRecord.uid)
        } catch (authError: any) {
            // If user doesn't exist in Auth, that's fine — continue with DB cleanup
            if (authError?.code !== "auth/user-not-found") {
                console.error("Error deleting auth user:", authError)
                return NextResponse.json(
                    { error: "Failed to delete auth user: " + (authError?.message ?? "Unknown error") },
                    { status: 500 }
                )
            }
        }

        // Step 2: Update senha_criada to false and remove from reset-requests
        // Use Admin SDK to bypass security rules
        const { getDatabase } = await import("firebase-admin/database")
        const { getApps } = await import("firebase-admin/app")
        const db = getDatabase(getApps()[0])

        // Update senha_criada to false
        await db.ref(`avaliacoes/${cpf}/senha_criada`).set(false)

        // Delete from reset-requests
        await db.ref(`reset-requests/${cpf}`).remove()

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error("Password reset error:", error)
        return NextResponse.json(
            { error: "Internal server error: " + (error?.message ?? "Unknown") },
            { status: 500 }
        )
    }
}
