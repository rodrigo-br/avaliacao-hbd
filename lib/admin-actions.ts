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
    const expectedPassword = ["00000000000", "43736307802"].includes(digits) ? (process.env.SUPER_ADMIN_PASSWORD || adminPassword) : adminPassword
    const isValid = adminCpfs.includes(digits) && password === expectedPassword

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

export async function getAdminsListAction(
    requestingCpf: string,
    requestingPassword: string
): Promise<{ cpf: string; nome: string }[]> {
    const fallback = await validateAdminAction(requestingCpf, requestingPassword)
    if (!fallback.valid || !["00000000000", "43736307802"].includes(requestingCpf.replace(/\D/g, ""))) return []

    const adminCpfEnv = process.env.ADMIN_CPFS || process.env.ADMIN_CPF
    if (!adminCpfEnv) return []

    const adminCpfs = adminCpfEnv.split(",").map(c => c.trim()).filter(c => !["00000000000", "43736307802"].includes(c))

    try {
        getAdminAuth()
        const { getDatabase } = await import("firebase-admin/database")
        const { getApps } = await import("firebase-admin/app")
        const db = getDatabase(getApps()[0])
        
        const results = await Promise.all(adminCpfs.map(async (cpf) => {
            const snapshot = await db.ref(`admins/${cpf}/nome`).once("value")
            return {
                cpf,
                nome: snapshot.exists() ? snapshot.val() : "Avaliador " + cpf.slice(0, 3)
            }
        }))

        return results.sort((a, b) => a.nome.localeCompare(b.nome))
    } catch (error) {
        console.error("Error fetching admins list:", error)
        return adminCpfs.map(cpf => ({ cpf, nome: "Avaliador " + cpf.slice(0, 3) }))
    }
}
