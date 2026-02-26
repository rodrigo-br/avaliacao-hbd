import { NextRequest, NextResponse } from "next/server"
import { getAdminAuth } from "@/lib/firebase-admin"
import { getStorage } from "firebase-admin/storage"
import { getApps } from "firebase-admin/app"

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
        const bucket = getStorage(getApps()[0]).bucket()

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

                    return NextResponse.json({ url })
                }
            } catch {
                continue
            }
        }

        // No photo found
        return NextResponse.json({ url: null }, { status: 404 })
    } catch (error: any) {
        console.error("Photo fetch error:", error)
        return NextResponse.json(
            { error: "Internal server error: " + (error?.message ?? "Unknown") },
            { status: 500 }
        )
    }
}
