import { NextRequest, NextResponse } from "next/server"
import { getAdminAuth } from "@/lib/firebase-admin"
import { getStorage } from "firebase-admin/storage"
import { getApps } from "firebase-admin/app"

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get("file") as File | null
        const cpf = formData.get("cpf") as string | null
        const adminCpf = formData.get("adminCpf") as string | null
        const adminPassword = formData.get("adminPassword") as string | null

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

        if (!cpf || !file) {
            return NextResponse.json(
                { error: "CPF and file are required" },
                { status: 400 }
            )
        }

        // Validate file type
        if (!file.type.startsWith("image/")) {
            return NextResponse.json(
                { error: "File must be an image" },
                { status: 400 }
            )
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            return NextResponse.json(
                { error: "Image must be under 2MB" },
                { status: 400 }
            )
        }

        // Initialize admin app
        getAdminAuth()
        const bucket = getStorage(getApps()[0]).bucket()

        // Get file extension
        const ext = file.name.split(".").pop() || "jpg"
        const filePath = `fotos/${cpf}.${ext}`

        // Delete any existing photos for this CPF (different extensions)
        const extensions = ["jpg", "jpeg", "png", "webp"]
        for (const existingExt of extensions) {
            try {
                const existingFile = bucket.file(`fotos/${cpf}.${existingExt}`)
                const [exists] = await existingFile.exists()
                if (exists) {
                    await existingFile.delete()
                }
            } catch {
                // Ignore errors when checking/deleting old files
            }
        }

        // Upload the new file
        const buffer = Buffer.from(await file.arrayBuffer())
        const fileRef = bucket.file(filePath)
        await fileRef.save(buffer, {
            metadata: {
                contentType: file.type,
            },
        })

        return NextResponse.json({ success: true, path: filePath })
    } catch (error: any) {
        console.error("Upload error:", error)
        return NextResponse.json(
            { error: "Internal server error: " + (error?.message ?? "Unknown") },
            { status: 500 }
        )
    }
}
