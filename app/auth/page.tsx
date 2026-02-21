"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { checkId, createPassword, login, requestReset } from "@/lib/auth"
import { LogoIcon } from "@/components/logo-icon"

type AuthStep = "check-id" | "login" | "create-password" | "not-found" | "reset-requested"

// ── Helpers ──────────────────────────────────────────

function formatCpf(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 11)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

function isValidCpf(cpf: string): boolean {
    return cpf.replace(/\D/g, "").length === 11
}

// ── Component ────────────────────────────────────────

export default function AuthPage() {
    const router = useRouter()
    const [step, setStep] = useState<AuthStep>("check-id")
    const [cpf, setCpf] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    // ── Handlers ─────────────────────────────────────

    async function handleCheckId(e: FormEvent) {
        e.preventDefault()
        if (!isValidCpf(cpf)) {
            setError("Digite um CPF válido com 11 dígitos.")
            return
        }

        setLoading(true)
        setError("")

        try {
            const result = await checkId(cpf)

            if (!result.exists) {
                setStep("not-found")
            } else if (!result.hasPassword) {
                setStep("create-password")
            } else {
                setStep("login")
            }
        } catch {
            setError("Erro ao verificar o CPF. Tente novamente.")
        } finally {
            setLoading(false)
        }
    }

    async function handleCreatePassword(e: FormEvent) {
        e.preventDefault()
        if (password.length < 6) {
            setError("A senha deve ter no mínimo 6 caracteres.")
            return
        }
        if (password !== confirmPassword) {
            setError("As senhas não coincidem.")
            return
        }

        setLoading(true)
        setError("")

        try {
            await createPassword(cpf, password)
            router.push("/dashboard")
        } catch {
            setError("Erro ao criar a senha. Tente novamente.")
        } finally {
            setLoading(false)
        }
    }

    async function handleLogin(e: FormEvent) {
        e.preventDefault()
        if (!password) {
            setError("Digite sua senha.")
            return
        }

        setLoading(true)
        setError("")

        try {
            await login(cpf, password)
            router.push("/dashboard")
        } catch {
            setError("Senha incorreta. Tente novamente.")
        } finally {
            setLoading(false)
        }
    }

    async function handleRequestReset() {
        setLoading(true)
        setError("")

        try {
            await requestReset(cpf)
            setStep("reset-requested")
        } catch {
            setError("Erro ao solicitar a redefinição. Tente novamente.")
        } finally {
            setLoading(false)
        }
    }

    function handleBack() {
        setStep("check-id")
        setPassword("")
        setConfirmPassword("")
        setError("")
    }

    // ── Render helpers ───────────────────────────────

    const inputClass =
        "w-full rounded-xl border border-border/50 bg-secondary/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all duration-200 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 backdrop-blur-sm"

    const buttonClass =
        "w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"

    const secondaryButtonClass =
        "w-full rounded-xl border border-border/50 bg-secondary/30 px-4 py-3 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-secondary/60 hover:text-foreground"

    // ── UI ───────────────────────────────────────────

    return (
        <main className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-8">
            {/* Background */}
            <div className="fixed inset-0 bg-background" />
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,106,0,0.12)_0%,_rgba(255,106,0,0.04)_35%,_transparent_70%)]" />
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,106,0,0.06)_0%,_transparent_50%)]" />

            {/* Card */}
            <div className="relative z-10 w-full max-w-[400px] animate-fade-in">
                <div className="rounded-3xl bg-card/40 backdrop-blur-xl border border-border/30 p-8 shadow-2xl shadow-primary/5 space-y-6">
                    {/* Logo */}
                    <div className="flex flex-col items-center text-center space-y-2">
                        <div className="relative scale-150 mb-4 transition-transform duration-500">
                            <LogoIcon />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Área do Aluno
                        </p>
                    </div>

                    {/* ── Step: Check ID ─────────────────── */}
                    {step === "check-id" && (
                        <form onSubmit={handleCheckId} className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="cpf" className="text-sm font-medium text-foreground/80">
                                    Digite seu CPF
                                </label>
                                <input
                                    id="cpf"
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="off"
                                    placeholder="000.000.000-00"
                                    value={cpf}
                                    onChange={(e) => {
                                        setCpf(formatCpf(e.target.value))
                                        setError("")
                                    }}
                                    className={inputClass}
                                />
                            </div>

                            {error && <p className="text-xs text-red-400">{error}</p>}

                            <button type="submit" disabled={loading} className={buttonClass}>
                                {loading ? (
                                    <span className="inline-flex items-center gap-2">
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                                        Verificando...
                                    </span>
                                ) : (
                                    "Continuar"
                                )}
                            </button>
                        </form>
                    )}

                    {/* ── Step: Not Found ────────────────── */}
                    {step === "not-found" && (
                        <div className="space-y-4 text-center">
                            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4">
                                <p className="text-sm text-red-400">
                                    ID não encontrado. Procure a secretaria da escola.
                                </p>
                            </div>
                            <button type="button" onClick={handleBack} className={secondaryButtonClass}>
                                ← Voltar
                            </button>
                        </div>
                    )}

                    {/* ── Step: Create Password ─────────── */}
                    {step === "create-password" && (
                        <form onSubmit={handleCreatePassword} className="space-y-4">
                            <div className="rounded-xl bg-primary/10 border border-primary/20 p-3">
                                <p className="text-xs text-primary/80 text-center">
                                    Primeiro acesso! Crie uma senha para acessar sua avaliação.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="new-password" className="text-sm font-medium text-foreground/80">
                                    Crie sua senha
                                </label>
                                <input
                                    id="new-password"
                                    type="password"
                                    placeholder="Mínimo 6 caracteres"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value)
                                        setError("")
                                    }}
                                    className={inputClass}
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="confirm-password" className="text-sm font-medium text-foreground/80">
                                    Confirme sua senha
                                </label>
                                <input
                                    id="confirm-password"
                                    type="password"
                                    placeholder="Digite novamente"
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value)
                                        setError("")
                                    }}
                                    className={inputClass}
                                />
                            </div>

                            {error && <p className="text-xs text-red-400">{error}</p>}

                            <button type="submit" disabled={loading} className={buttonClass}>
                                {loading ? (
                                    <span className="inline-flex items-center gap-2">
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                                        Criando...
                                    </span>
                                ) : (
                                    "Criar senha"
                                )}
                            </button>

                            <button type="button" onClick={handleBack} className={secondaryButtonClass}>
                                ← Voltar
                            </button>
                        </form>
                    )}

                    {/* ── Step: Login ────────────────────── */}
                    {step === "login" && (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="login-password" className="text-sm font-medium text-foreground/80">
                                    Digite sua senha
                                </label>
                                <input
                                    id="login-password"
                                    type="password"
                                    placeholder="Sua senha"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value)
                                        setError("")
                                    }}
                                    className={inputClass}
                                />
                            </div>

                            {error && <p className="text-xs text-red-400">{error}</p>}

                            <button type="submit" disabled={loading} className={buttonClass}>
                                {loading ? (
                                    <span className="inline-flex items-center gap-2">
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                                        Entrando...
                                    </span>
                                ) : (
                                    "Entrar"
                                )}
                            </button>

                            <div className="flex items-center justify-between">
                                <button type="button" onClick={handleBack} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                                    ← Voltar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleRequestReset}
                                    disabled={loading}
                                    className="text-xs text-primary/80 hover:text-primary transition-colors"
                                >
                                    Esqueci minha senha
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ── Step: Reset Requested ──────────── */}
                    {step === "reset-requested" && (
                        <div className="space-y-4 text-center">
                            <div className="rounded-xl bg-primary/10 border border-primary/20 p-4">
                                <p className="text-sm text-primary/90">
                                    Solicitação enviada. A escola irá autorizar a redefinição da sua senha.
                                </p>
                            </div>
                            <button type="button" onClick={handleBack} className={secondaryButtonClass}>
                                ← Voltar ao início
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-[10px] text-muted-foreground/40 mt-4">
                    Hei Bora Dançar © {new Date().getFullYear()}
                </p>
            </div>
        </main>
    )
}
