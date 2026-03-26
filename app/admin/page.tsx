"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { validateAdminAction, saveAdminNameAction } from "@/lib/admin-actions"
import { loginAdminFirebase, setAdminSession } from "@/lib/admin-auth"
import { LogoIcon } from "@/components/logo-icon"
import { Shield, UserCircle, Key } from "lucide-react"

function formatCpf(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 11)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

export default function AdminLoginPage() {
    const router = useRouter()
    
    // Step 1 state
    const [cpf, setCpf] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    
    // Step 2 state (name prompt)
    const [needsName, setNeedsName] = useState(false)
    const [name, setName] = useState("")
    const [savingName, setSavingName] = useState(false)

    async function handleLogin(e: FormEvent) {
        e.preventDefault()

        if (!cpf || !password) {
            setError("Preencha todos os campos.")
            return
        }

        setLoading(true)
        setError("")

        try {
            // Validate credentials & fetch saved name
            const { valid, name: savedName } = await validateAdminAction(cpf, password)

            if (!valid) {
                setError("Credenciais inválidas.")
                setLoading(false)
                return
            }

            if (savedName) {
                // Name already exists, proceed to login directly
                await loginAdminFirebase(cpf, password)
                setAdminSession(cpf, password, savedName)
                router.push("/admin/dashboard")
            } else {
                // No name stored, transition to Step 2
                setNeedsName(true)
                setLoading(false)
            }
        } catch {
            setError("Erro ao autenticar. Tente novamente.")
            setLoading(false)
        }
    }

    async function handleSaveName(e: FormEvent) {
        e.preventDefault()
        
        if (!name.trim()) {
            setError("O nome é obrigatório.")
            return
        }

        setSavingName(true)
        setError("")

        try {
            const { success, error: saveError } = await saveAdminNameAction(cpf, password, name)
            if (!success) {
                setError(saveError ?? "Erro ao salvar o nome.")
                setSavingName(false)
                return
            }

            // Successfully saved the name, finalize login
            await loginAdminFirebase(cpf, password)
            setAdminSession(cpf, password, name.trim())
            router.push("/admin/dashboard")
        } catch {
            setError("Erro ao salvar nome. Tente novamente.")
            setSavingName(false)
        }
    }

    const inputClass =
        "w-full rounded-xl border border-border/50 bg-secondary/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all duration-200 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 backdrop-blur-sm"

    const buttonClass =
        "w-full rounded-xl bg-gradient-to-r from-primary to-orange-500 px-4 py-3 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"

    return (
        <main className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-8">
            {/* Background */}
            <div className="fixed inset-0 bg-background" />
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,106,0,0.12)_0%,_rgba(255,106,0,0.04)_35%,_transparent_70%)]" />
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,106,0,0.06)_0%,_transparent_50%)]" />

            {/* Card */}
            <div className="relative z-10 w-full max-w-[400px] animate-fade-in">
                <div className="rounded-3xl bg-card/40 backdrop-blur-xl border border-border/30 p-8 shadow-2xl shadow-primary/5 space-y-6">
                    {/* Logo + Admin Badge */}
                    <div className="flex flex-col items-center text-center space-y-3">
                        <div className="relative scale-150 mb-4 transition-transform duration-500">
                            <LogoIcon />
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1">
                            <Shield className="w-3.5 h-3.5 text-primary" />
                            <span className="text-xs font-semibold text-primary tracking-wider uppercase">
                                Painel Administrativo
                            </span>
                        </div>
                    </div>

                    {!needsName ? (
                        /* Step 1: CPF & Password Form */
                        <form onSubmit={handleLogin} className="space-y-4 animate-fade-in">
                            <div className="space-y-2">
                                <label htmlFor="admin-cpf" className="text-sm font-medium text-foreground/80">
                                    CPF do Admin
                                </label>
                                <input
                                    id="admin-cpf"
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

                            <div className="space-y-2">
                                <label htmlFor="admin-password" className="text-sm font-medium text-foreground/80">
                                    Senha
                                </label>
                                <input
                                    id="admin-password"
                                    type="password"
                                    placeholder="Senha do administrador"
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
                                        Autenticando...
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-2 justify-center">
                                        <Shield className="w-4 h-4" />
                                        Entrar como Admin
                                    </span>
                                )}
                            </button>
                        </form>
                    ) : (
                        /* Step 2: Ask for Name */
                        <form onSubmit={handleSaveName} className="space-y-4 animate-fade-in">
                            <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 p-4 mb-2">
                                <p className="text-sm font-semibold text-orange-400 flex items-center gap-2 mb-1">
                                    <Key className="w-4 h-4" /> Qual é o seu nome?
                                </p>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Bem-vindo! Parece que este é o seu primeiro acesso. 
                                    Preencha o nome que aparecerá para os alunos em suas avaliações.
                                    Você só precisará fazer isso uma vez.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="admin-name" className="text-sm font-medium text-foreground/80">
                                    Seu Nome (Avaliador)
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                        <UserCircle className="w-4 h-4 text-muted-foreground/40" />
                                    </div>
                                    <input
                                        id="admin-name"
                                        type="text"
                                        placeholder="Ex: Prof. Rodrigo"
                                        value={name}
                                        onChange={(e) => {
                                            setName(e.target.value)
                                            setError("")
                                        }}
                                        className={`${inputClass} pl-10`}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {error && <p className="text-xs text-red-400">{error}</p>}

                            <button type="submit" disabled={savingName} className={buttonClass}>
                                {savingName ? (
                                    <span className="inline-flex items-center gap-2">
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                                        Salvando...
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-2 justify-center">
                                        <UserCircle className="w-4 h-4" />
                                        Salvar e Entrar
                                    </span>
                                )}
                            </button>
                        </form>
                    )}

                    {/* Back to student area / restart login */}
                    <div className="text-center pt-2">
                        {needsName ? (
                            <button
                                type="button"
                                onClick={() => {
                                    setNeedsName(false)
                                    setPassword("")
                                }}
                                className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors"
                            >
                                ← Cancelar
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => router.push("/auth")}
                                className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors"
                            >
                                ← Voltar para área do aluno
                            </button>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-[10px] text-muted-foreground/40 mt-4">
                    Hei Bora Dançar © {new Date().getFullYear()}
                </p>
            </div>
        </main>
    )
}
