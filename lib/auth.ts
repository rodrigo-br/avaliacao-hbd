import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    type User,
} from "firebase/auth"
import { ref, get, set, update, serverTimestamp } from "firebase/database"
import { getFirebaseAuth, getFirebaseDb } from "./firebase-app"

// ── Helpers ──────────────────────────────────────────

/** Converte CPF para email fictício usado no Firebase Auth */
function cpfToEmail(cpf: string): string {
    const digits = cpf.replace(/\D/g, "")
    return `${digits}@donzelord.app`
}

/** Extrai o CPF (só dígitos) do email do Firebase Auth */
export function emailToCpf(email: string): string {
    return email.replace("@donzelord.app", "")
}

// ── Check ID ─────────────────────────────────────────

export interface CheckIdResult {
    exists: boolean
    hasPassword: boolean
}

/**
 * Verifica se o CPF existe no banco e se já tem senha criada.
 * Compatível com regras de segurança restritas.
 */
export async function checkId(cpf: string): Promise<CheckIdResult> {
    const digits = cpf.replace(/\D/g, "")

    // Buscamos apenas os campos que deixamos públicos nas regras do Firebase
    // Se conseguirmos ler o nome do aluno, significa que o CPF existe
    const [snapSenha, snapNome] = await Promise.all([
        get(ref(getFirebaseDb(), `avaliacoes/${digits}/senha_criada`)),
        get(ref(getFirebaseDb(), `avaliacoes/${digits}/dados/nomeAluno`))
    ])

    if (!snapNome.exists()) {
        return { exists: false, hasPassword: false }
    }

    return {
        exists: true,
        hasPassword: snapSenha.val() === true
    }
}

// ── Criar Senha (primeiro acesso) ────────────────────

export async function createPassword(cpf: string, password: string) {
    const digits = cpf.replace(/\D/g, "")
    const email = cpfToEmail(digits)

    // Cria o usuário no Firebase Auth e já faz login
    const credential = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password)

    // Marca no DB que a senha foi criada
    await update(ref(getFirebaseDb(), `avaliacoes/${digits}`), {
        senha_criada: true,
    })

    return credential.user
}

// ── Login ────────────────────────────────────────────

export async function login(cpf: string, password: string) {
    const digits = cpf.replace(/\D/g, "")
    const email = cpfToEmail(digits)

    const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email, password)
    return credential.user
}

// ── Esqueci Senha ────────────────────────────────────

/**
 * Registra uma solicitação de reset no DB.
 * NÃO reseta automaticamente — a escola precisa autorizar.
 */
export async function requestReset(cpf: string) {
    const digits = cpf.replace(/\D/g, "")
    await set(ref(getFirebaseDb(), `reset-requests/${digits}`), {
        cpf: digits,
        requestedAt: serverTimestamp(),
        status: "pending",
    })
}

// ── Logout ───────────────────────────────────────────

export async function logout() {
    await signOut(getFirebaseAuth())
}

// ── Observer ─────────────────────────────────────────

export function onAuthChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(getFirebaseAuth(), callback)
}
