import { NextRequest, NextResponse } from "next/server"
import { getAdminAuth } from "@/lib/firebase-admin"
import { getStorage } from "firebase-admin/storage"
import { getApps } from "firebase-admin/app"
import { getDatabase } from "firebase-admin/database"

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ cpf: string }> }
) {
    try {
        const { cpf } = await params

        if (!cpf) {
            return NextResponse.json(
                { error: "CPF is required" },
                { status: 400 }
            )
        }

        // Initialize admin app
        getAdminAuth()
        const app = getApps()[0]
        const bucket = getStorage(app).bucket()
        const db = getDatabase(app)

        // Try different extensions
        const extensions = ["jpg", "jpeg", "png", "webp"]

        for (const ext of extensions) {
            try {
                const file = bucket.file(`fotos/${cpf}.${ext}`)
                const [exists] = await file.exists()

                if (exists) {
                    // Generate a signed URL valid for 1 hour
                    const [url] = await file.getSignedUrl({
                        action: "read",
                        expires: Date.now() + 60 * 60 * 1000, // 1 hour
                    })

                    // Asynchronously mark that the student has a profile picture
                    db.ref(`avaliacoes/${cpf.replace(/\D/g, "")}/dados/hasPicture`).set(true).catch(console.error)

                    return NextResponse.json({ url })
                }
            } catch {
                continue
            }
        }

        // No photo found. Asynchronously mark that the student lacks a profile picture.
        db.ref(`avaliacoes/${cpf.replace(/\D/g, "")}/dados/hasPicture`).set(false).catch(console.error)
        return NextResponse.json({ url: null }, { status: 404 })
    } catch (error: any) {
        console.error("Photo fetch error:", error)
        return NextResponse.json(
            { error: "Internal server error: " + (error?.message ?? "Unknown") },
            { status: 500 }
        )
    }
}
