"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { isAdminAuthenticated } from "@/lib/admin-auth"
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
import { ArrowLeft, Eye } from "lucide-react"

type PreviewState = "loading" | "ready" | "no-data"

export default function AdminPreviewPage() {
    const router = useRouter()
    const params = useParams()
    const cpf = params.cpf as string

    const [state, setState] = useState<PreviewState>("loading")
    const [avaliacao, setAvaliacao] = useState<Avaliacao | null>(null)
    const [authenticated, setAuthenticated] = useState(false)

    useEffect(() => {
        if (!isAdminAuthenticated()) {
            router.replace("/admin")
            return
        }
        setAuthenticated(true)

        async function loadData() {
            try {
                const snapshot = await get(ref(getFirebaseDb(), `avaliacoes/${cpf}`))
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
        }

        loadData()
    }, [router, cpf])

    function handleBack() {
        router.push("/admin/dashboard")
    }

    if (!authenticated) return null

    // ── Loading ──
    if (state === "loading") {
        return (
            <main className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-8">
                <div className="fixed inset-0 bg-background" />
                <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,106,0,0.12)_0%,_rgba(255,106,0,0.04)_35%,_transparent_70%)]" />
                <div className="relative z-10 text-center space-y-3">
                    <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                    <p className="text-sm text-muted-foreground">Carregando preview...</p>
                </div>
            </main>
        )
    }

    // ── No Data ──
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
                        onClick={handleBack}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border/50 bg-secondary/30 px-4 py-2 text-sm text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar ao painel
                    </button>
                </div>
            </main>
        )
    }

    // ── Ready — Render exactly like the student dashboard ──

    const attributes = mapAvaliacaoParaAttributes(avaliacao)
    const subAttributesMap = mapSubAttributes(avaliacao)
    const { pontosFortes, pontosDesenvolver } = mapEvolucao(avaliacao)

    return (
        <main className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-8">
            {/* Background Radial Gradient */}
            <div className="fixed inset-0 bg-background" />
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,106,0,0.12)_0%,_rgba(255,106,0,0.04)_35%,_transparent_70%)]" />
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,106,0,0.06)_0%,_transparent_50%)]" />

            {/* Main Card */}
            <div className="relative z-10 w-full max-w-[420px]">
                <div className="rounded-3xl bg-card/40 backdrop-blur-xl border border-border/30 p-6 shadow-2xl shadow-primary/5">
                    {/* Top Bar: Back + Admin Preview Badge + Logo */}
                    <div className="flex items-center justify-between mb-2 animate-fade-in">
                        <button
                            onClick={handleBack}
                            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted-foreground/60 hover:text-foreground hover:bg-secondary/50 transition-all"
                            title="Voltar ao painel"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Voltar
                        </button>
                        <LogoIcon />
                    </div>

                    {/* Preview Badge */}
                    <div className="flex justify-center mb-4 animate-fade-in animation-delay-100">
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1">
                            <Eye className="w-3 h-3 text-primary" />
                            <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                                Preview — Visão do Aluno
                            </span>
                        </div>
                    </div>

                    {/* Profile Section with Radial Attributes */}
                    <section className="relative mb-8" aria-label="Perfil do aluno">
                        <ProfileSection
                            attributes={attributes}
                            subAttributesMap={subAttributesMap}
                            nomeAluno={avaliacao.dados.nomeAluno}
                            nivel={avaliacao.dados.nivel}
                            cpf={cpf}
                        />
                    </section>

                    {/* Bottom Card - Feedback */}
                    <section className="mb-6" aria-label="Feedback do aluno">
                        <BottomCard
                            pontosFortes={pontosFortes}
                            pontosDesenvolver={pontosDesenvolver}
                        />
                    </section>

                    {/* Action Buttons */}
                    <section aria-label="Acoes">
                        <ActionButtons
                            feedback={avaliacao.feedback ?? []}
                            sugestoes={avaliacao.sugestoes ?? { observacoes: "", selecionadas: [] }}
                            professor={avaliacao.dados.professor}
                        />
                    </section>
                </div>
            </div>
        </main>
    )
}
