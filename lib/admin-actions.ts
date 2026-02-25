"use server"

// ── Server Action: Validate Admin Credentials ────────────
// Runs on the server so env vars (ADMIN_CPF, ADMIN_PASSWORD)
// are NEVER exposed to the browser.

export async function validateAdminAction(
    cpf: string,
    password: string
): Promise<{ valid: boolean }> {
    const adminCpf = process.env.ADMIN_CPF
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminCpf || !adminPassword) {
        console.error("Admin credentials not configured in environment variables.")
        return { valid: false }
    }

    const digits = cpf.replace(/\D/g, "")
    const isValid = digits === adminCpf && password === adminPassword

    return { valid: isValid }
}
