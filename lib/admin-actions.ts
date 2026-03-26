"use server"

// ── Server Action: Validate Admin Credentials ────────────
// Runs on the server so env vars (ADMIN_CPF, ADMIN_PASSWORD)
// are NEVER exposed to the browser.

import { getAdminAuth } from "@/lib/firebase-admin"

export async function validateAdminAction(
    cpf: string,
    password: string
): Promise<{ valid: boolean; name?: string }> {
    const adminCpfEnv = process.env.ADMIN_CPFS || process.env.ADMIN_CPF
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminCpfEnv || !adminPassword) {
        console.error("Admin credentials not configured in environment variables.")
        return { valid: false }
    }

    const adminCpfs = adminCpfEnv.split(",").map(c => c.trim())
    const digits = cpf.replace(/\D/g, "")
    const isValid = adminCpfs.includes(digits) && password === adminPassword

    if (!isValid) return { valid: false }

    try {
        // Fetch saved admin name using Admin SDK
        getAdminAuth()
        const { getDatabase } = await import("firebase-admin/database")
        const { getApps } = await import("firebase-admin/app")
        const db = getDatabase(getApps()[0])
        const snapshot = await db.ref(`admins/${digits}/nome`).once("value")
        const name = snapshot.exists() ? snapshot.val() : undefined

        return { valid: true, name }
    } catch (error) {
        console.error("Error fetching admin name:", error)
        return { valid: true }
    }
}

export async function saveAdminNameAction(
    cpf: string,
    password: string,
    name: string
): Promise<{ success: boolean; error?: string }> {
    const fallback = await validateAdminAction(cpf, password)
    if (!fallback.valid) return { success: false, error: "Credenciais inválidas" }

    try {
        const digits = cpf.replace(/\D/g, "")
        getAdminAuth()
        const { getDatabase } = await import("firebase-admin/database")
        const { getApps } = await import("firebase-admin/app")
        const db = getDatabase(getApps()[0])
        await db.ref(`admins/${digits}/nome`).set(name.trim())
        
        return { success: true }
    } catch (error: any) {
        console.error("Error saving admin name:", error)
        return { success: false, error: "Falha ao salvar nome do avaliador" }
    }
}
