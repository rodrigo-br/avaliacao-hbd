"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { onAuthChange, emailToCpf, logout } from "@/lib/auth"
import { getFirebaseDb } from "@/lib/firebase-app"
import { ref, get } from "firebase/database"
import {
    mapAvaliacaoParaAttributes,
    mapSubAttributes,
    mapEvolucao,
    type Avaliacao,
} from "@/lib/firebase"
import { ProfileSection } from "@/components/profile-section"
import { BottomCard } from "@/components/bottom-card"
import { ActionButtons } from "@/components/action-buttons"
import { LogoIcon } from "@/components/logo-icon"
import { LogOut } from "lucide-react"

type DashboardState = "loading" | "ready" | "no-data"

// Categories that are locked for "Branco" level students
const BRANCO_LOCKED_CATEGORIES = new Set(["Técnica", "Movimentos", "Comportamento"])

// Placeholder sub-attributes used for locked categories to prevent data leaks via DevTools
const PLACEHOLDER_SUB_ATTRIBUTES: Record<string, { name: string; rating: number }[]> = {
    "Técnica": [
        { name: "Postura e alinhamento corporal", rating: 3 },
        { name: "Coordenação motora", rating: 3 },
        { name: "Consciência corporal", rating: 3 },
        { name: "Base e transferência de peso", rating: 3 },
        { name: "Equilíbrio", rating: 3 },
        { name: "Musicalidade (tempo e ritmo)", rating: 3 },
    ],
    "Movimentos": [
        { name: "Execução dos passos básicos", rating: 3 },
        { name: "Execução de giros", rating: 3 },
        { name: "Fluidez nos movimentos", rating: 3 },
        { name: "Memorização das sequências", rating: 3 },
    ],
    "Comportamento": [
        { name: "Frequência e pontualidade", rating: 3 },
        { name: "Atenção e foco em aula", rating: 3 },
        { name: "Abertura para aprender e corrigir", rating: 3 },
        { name: "Interação com colegas", rating: 3 },
    ],
}

const PLACEHOLDER_FEEDBACK = [{ nome: "Feedback", valor: "Continue praticando e evoluindo. Seu feedback detalhado estará disponível no próximo nível." }]
const PLACEHOLDER_SUGESTOES = { observacoes: "", selecionadas: ["Continuar praticando"] }

export default function DashboardPage() {
    const router = useRouter()
    const [state, setState] = useState<DashboardState>("loading")
    const [avaliacao, setAvaliacao] = useState<Avaliacao | null>(null)
    const [cpf, setCpf] = useState("")

    useEffect(() => {
        const unsubscribe = onAuthChange(async (user) => {
            if (!user || !user.email) {
                router.replace("/auth")
                return
            }

            const userCpf = emailToCpf(user.email)
            setCpf(userCpf)

            try {
                const snapshot = await get(ref(getFirebaseDb(), `avaliacoes/${userCpf}`))
                if (snapshot.exists()) {
                    setAvaliacao(snapshot.val())
                    setState("ready")
                } else {
                    setState("no-data")
                }
            } catch (error) {
                console.error("Erro ao buscar dados:", error)
                setState("no-data")
            }
        })

        return () => unsubscribe()
    }, [router])

    async function handleLogout() {
        await logout()
        router.replace("/auth")
    }

    // ── Loading ──────────────────────────────────────

    if (state === "loading") {
        return (
            <main className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-8">
                <div className="fixed inset-0 bg-background" />
                <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,106,0,0.12)_0%,_rgba(255,106,0,0.04)_35%,_transparent_70%)]" />
                <div className="relative z-10 text-center space-y-3">
                    <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                    <p className="text-sm text-muted-foreground">Carregando sua avaliação...</p>
                </div>
            </main>
        )
    }

    // ── No Data ──────────────────────────────────────

    if (state === "no-data" || !avaliacao) {
        return (
            <main className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-8">
                <div className="fixed inset-0 bg-background" />
                <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,106,0,0.12)_0%,_rgba(255,106,0,0.04)_35%,_transparent_70%)]" />
                <div className="relative z-10 text-center space-y-3 max-w-md">
                    <p className="text-4xl">🔍</p>
                    <p className="text-lg font-semibold text-foreground">
                        Avaliação não encontrada
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Nenhuma avaliação encontrada para o CPF <strong>&quot;{cpf}&quot;</strong>.
                    </p>
                    <button
                        onClick={handleLogout}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border/50 bg-secondary/30 px-4 py-2 text-sm text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-all"
                    >
                        <LogOut className="w-4 h-4" />
                        Sair
                    </button>
                </div>
            </main>
        )
    }

    // ── Ready ────────────────────────────────────────

    const isBranco = avaliacao.dados.nivel === "Branco"

    // For "Branco" level: replace real star values with placeholders for locked categories
    const attributes = mapAvaliacaoParaAttributes(avaliacao).map((attr) => {
        if (isBranco && BRANCO_LOCKED_CATEGORIES.has(attr.title)) {
            return { ...attr, stars: 3 } // placeholder star value
        }
        return attr
    })

    // For "Branco" level: replace real sub-attributes with placeholders
    const realSubAttributes = mapSubAttributes(avaliacao)
    const subAttributesMap = isBranco
        ? Object.fromEntries(
            Object.entries(realSubAttributes).map(([key, value]) =>
                BRANCO_LOCKED_CATEGORIES.has(key)
                    ? [key, PLACEHOLDER_SUB_ATTRIBUTES[key] ?? value]
                    : [key, value]
            )
        )
        : realSubAttributes

    const { pontosFortes, pontosDesenvolver } = mapEvolucao(avaliacao)

    // For "Branco" level: use placeholder feedback and sugestões
    const feedbackData = isBranco ? PLACEHOLDER_FEEDBACK : (avaliacao.feedback ?? [])
    const sugestoesData = isBranco ? PLACEHOLDER_SUGESTOES : (avaliacao.sugestoes ?? { observacoes: "", selecionadas: [] })

    return (
        <main className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-8">
            {/* Background Radial Gradient */}
            <div className="fixed inset-0 bg-background" />
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,106,0,0.12)_0%,_rgba(255,106,0,0.04)_35%,_transparent_70%)]" />
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,106,0,0.06)_0%,_transparent_50%)]" />

            {/* Main Card */}
            <div className="relative z-10 w-full max-w-[420px]">
                <div className="rounded-3xl bg-card/40 backdrop-blur-xl border border-border/30 p-6 shadow-2xl shadow-primary/5">
                    {/* Top Bar: Logout + Logo */}
                    <div className="flex items-center justify-between mb-2 animate-fade-in">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted-foreground/60 hover:text-foreground hover:bg-secondary/50 transition-all"
                            title="Sair"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            Sair
                        </button>
                        <LogoIcon />
                    </div>

                    {/* Profile Section with Radial Attributes */}
                    <section className="relative mb-8" aria-label="Perfil do aluno">
                        <ProfileSection
                            attributes={attributes}
                            subAttributesMap={subAttributesMap}
                            nomeAluno={avaliacao.dados.nomeAluno}
                            nivel={avaliacao.dados.nivel}
                            cpf={cpf}
                            lockedCategories={isBranco ? BRANCO_LOCKED_CATEGORIES : undefined}
                        />
                    </section>

                    {/* Bottom Card - Feedback (Evolução - always visible) */}
                    <section className="mb-6" aria-label="Feedback do aluno">
                        <BottomCard
                            pontosFortes={pontosFortes}
                            pontosDesenvolver={pontosDesenvolver}
                        />
                    </section>

                    {/* Action Buttons */}
                    <section aria-label="Acoes">
                        <ActionButtons
                            feedback={feedbackData}
                            sugestoes={sugestoesData}
                            professor={isBranco ? undefined : avaliacao.dados.professor}
                            locked={isBranco}
                        />
                    </section>
                </div>
            </div>
        </main>
    )
}
