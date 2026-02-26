// ── Admin Authentication ──────────────────────────────────
// Handles Firebase Auth login for admin and session management.
// Credential validation is done server-side via admin-actions.ts

import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
} from "firebase/auth"
import { getFirebaseAuth } from "./firebase-app"

const ADMIN_SESSION_KEY = "donzelord_admin_session"

/**
 * Converts admin CPF to the fake email used by Firebase Auth.
 * Follows the same pattern as the student auth: `digits@donzelord.app`
 */
function adminCpfToEmail(cpf: string): string {
    const digits = cpf.replace(/\D/g, "")
    return `${digits}@donzelord.app`
}

/**
 * Signs in (or creates) the admin user in Firebase Auth.
 * This is needed so the Firebase SDK can read data with auth rules.
 */
export async function loginAdminFirebase(cpf: string, password: string): Promise<void> {
    const email = adminCpfToEmail(cpf)
    const auth = getFirebaseAuth()

    try {
        // Try to sign in first
        await signInWithEmailAndPassword(auth, email, password)
    } catch (error: unknown) {
        const firebaseError = error as { code?: string }
        if (firebaseError.code === "auth/user-not-found" || firebaseError.code === "auth/invalid-credential") {
            // User doesn't exist yet — create it
            await createUserWithEmailAndPassword(auth, email, password)
        } else {
            throw error
        }
    }
}

/**
 * Signs out from Firebase Auth and clears admin session.
 */
export async function logoutAdmin(): Promise<void> {
    await signOut(getFirebaseAuth())
    clearAdminSession()
}

/**
 * Stores the admin session in sessionStorage.
 */
export function setAdminSession(cpf?: string, password?: string): void {
    if (typeof window !== "undefined") {
        sessionStorage.setItem(ADMIN_SESSION_KEY, "true")
        if (cpf) sessionStorage.setItem("admin_cpf", cpf.replace(/\D/g, ""))
        if (password) sessionStorage.setItem("admin_password", password)
    }
}

/**
 * Checks if there is an active admin session.
 */
export function isAdminAuthenticated(): boolean {
    if (typeof window === "undefined") return false
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === "true"
}

/**
 * Clears the admin session.
 */
export function clearAdminSession(): void {
    if (typeof window !== "undefined") {
        sessionStorage.removeItem(ADMIN_SESSION_KEY)
        sessionStorage.removeItem("admin_cpf")
        sessionStorage.removeItem("admin_password")
    }
}

/**
 * Retrieves stored admin credentials from sessionStorage.
 */
export function getAdminCredentials(): { cpf: string; password: string } {
    if (typeof window === "undefined") return { cpf: "", password: "" }
    return {
        cpf: sessionStorage.getItem("admin_cpf") ?? "",
        password: sessionStorage.getItem("admin_password") ?? "",
    }
}
