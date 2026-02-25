"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { isAdminAuthenticated, logoutAdmin } from "@/lib/admin-auth"
import { getFirebaseDb } from "@/lib/firebase-app"
import { ref, get } from "firebase/database"
import { calcularMedia, type Avaliacao } from "@/lib/firebase"
import { LogoIcon } from "@/components/logo-icon"
import { LogOut, Shield, Eye, Users, Search, Star, Plus } from "lucide-react"

interface AvaliacaoComCpf {
    cpf: string
    avaliacao: Avaliacao
}

export default function AdminDashboardPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [avaliacoes, setAvaliacoes] = useState<AvaliacaoComCpf[]>([])
    const [search, setSearch] = useState("")
    const [authenticated, setAuthenticated] = useState(false)

    useEffect(() => {
        if (!isAdminAuthenticated()) {
            router.replace("/admin")
            return
        }
        setAuthenticated(true)

        async function loadData() {
            try {
                const snapshot = await get(ref(getFirebaseDb(), "avaliacoes"))
                if (snapshot.exists()) {
                    const data = snapshot.val() as Record<string, Avaliacao>
                    const list: AvaliacaoComCpf[] = Object.entries(data).map(([cpf, avaliacao]) => ({
                        cpf,
                        avaliacao,
                    }))
                    // Sort alphabetically by student name
                    list.sort((a, b) =>
                        (a.avaliacao.dados?.nomeAluno ?? "").localeCompare(b.avaliacao.dados?.nomeAluno ?? "")
                    )
                    setAvaliacoes(list)
                }
            } catch (error) {
                console.error("Erro ao carregar avaliações:", error)
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [router])

    async function handleLogout() {
        await logoutAdmin()
        router.replace("/admin")
    }

    function handlePreview(cpf: string) {
        router.push(`/admin/preview/${cpf}`)
    }

    // ── Filter logic ──
    const filteredAvaliacoes = avaliacoes.filter((item) => {
        const q = search.toLowerCase()
        const nome = (item.avaliacao.dados?.nomeAluno ?? "").toLowerCase()
        const turma = (item.avaliacao.dados?.turma ?? "").toLowerCase()
        const modalidade = (item.avaliacao.dados?.modalidade ?? "").toLowerCase()
        const nivel = (item.avaliacao.dados?.nivel ?? "").toLowerCase()
        const cpf = item.cpf.toLowerCase()
        return nome.includes(q) || turma.includes(q) || modalidade.includes(q) || nivel.includes(q) || cpf.includes(q)
    })

    // ── Compute overall average stars for each avaliacao ──
    function overallStars(av: Avaliacao): number {
        const categories = [av.tecnica, av.movimentos, av.expressao, av.comportamento, av.conexao]
        const medias = categories.map((c) => calcularMedia(c ?? []))
        const valid = medias.filter((m) => m > 0)
        if (valid.length === 0) return 0
        return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length)
    }

    // ── Level badge color ──
    function levelBadgeClass(nivel: string): string {
        switch (nivel) {
            case "Verde":
                return "bg-green-500/15 text-green-400 border-green-500/30"
            case "Laranja":
                return "bg-orange-500/15 text-orange-400 border-orange-500/30"
            case "Lilás":
                return "bg-purple-500/15 text-purple-400 border-purple-500/30"
            default:
                return "bg-primary/15 text-primary border-primary/30"
        }
    }

    if (!authenticated) return null

    // ── Loading ──
    if (loading) {
        return (
            <main className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-8">
                <div className="fixed inset-0 bg-background" />
                <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,106,0,0.12)_0%,_rgba(255,106,0,0.04)_35%,_transparent_70%)]" />
                <div className="relative z-10 text-center space-y-3">
                    <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                    <p className="text-sm text-muted-foreground">Carregando avaliações...</p>
                </div>
            </main>
        )
    }

    return (
        <main className="relative min-h-screen overflow-hidden px-4 py-8">
            {/* Background */}
            <div className="fixed inset-0 bg-background" />
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,106,0,0.12)_0%,_rgba(255,106,0,0.04)_35%,_transparent_70%)]" />
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,106,0,0.06)_0%,_transparent_50%)]" />

            {/* Content */}
            <div className="relative z-10 w-full max-w-3xl mx-auto space-y-6">
                {/* Header Card */}
                <div className="rounded-3xl bg-card/40 backdrop-blur-xl border border-border/30 p-6 shadow-2xl shadow-primary/5 animate-fade-in">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <LogoIcon />
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-lg font-bold text-foreground">Painel Admin</h1>
                                    <div className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5">
                                        <Shield className="w-3 h-3 text-primary" />
                                        <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">Admin</span>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Gerencie e visualize todas as avaliações
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-muted-foreground/60 hover:text-foreground hover:bg-secondary/50 transition-all"
                            title="Sair"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            Sair
                        </button>
                    </div>
                </div>

                {/* Stats + Search Row */}
                <div className="flex flex-col sm:flex-row gap-4 animate-fade-in animation-delay-100">
                    {/* Stats */}
                    <div className="flex gap-3">
                        <div className="rounded-2xl bg-card/40 backdrop-blur-xl border border-border/30 px-4 py-3 shadow-lg shadow-primary/5 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                <Users className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-foreground">{avaliacoes.length}</p>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Avaliações</p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push("/admin/criar-avaliacao")}
                            className="rounded-2xl bg-gradient-to-r from-primary to-orange-500 px-5 py-3 shadow-lg shadow-primary/20 flex items-center gap-2 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:brightness-110 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Plus className="w-4 h-4" />
                            Criar Avaliação
                        </button>
                    </div>

                    {/* Search */}
                    <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <Search className="w-4 h-4 text-muted-foreground/50" />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar por nome, turma, modalidade ou CPF..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all duration-200 focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                </div>

                {/* Evaluations List */}
                <div className="space-y-3 animate-fade-in animation-delay-200">
                    {filteredAvaliacoes.length === 0 ? (
                        <div className="rounded-2xl bg-card/40 backdrop-blur-xl border border-border/30 p-8 text-center">
                            <p className="text-3xl mb-2">🔍</p>
                            <p className="text-sm text-muted-foreground">
                                {search ? "Nenhuma avaliação encontrada para essa busca." : "Nenhuma avaliação cadastrada."}
                            </p>
                        </div>
                    ) : (
                        filteredAvaliacoes.map((item, index) => {
                            const dados = item.avaliacao.dados
                            const stars = overallStars(item.avaliacao)

                            return (
                                <div
                                    key={item.cpf}
                                    className="group rounded-2xl bg-card/40 backdrop-blur-xl border border-border/30 p-4 shadow-lg shadow-primary/5 transition-all duration-300 hover:border-primary/30 hover:shadow-primary/10 hover:bg-card/60"
                                    style={{ animationDelay: `${Math.min(index * 50, 500)}ms` }}
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        {/* Left: Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <h3 className="text-sm font-bold text-foreground truncate">
                                                    {dados?.nomeAluno ?? "Sem nome"}
                                                </h3>
                                                {dados?.nivel && (
                                                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${levelBadgeClass(dados.nivel)}`}>
                                                        {dados.nivel}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                                                {dados?.turma && (
                                                    <span>Turma: <span className="text-foreground/70">{dados.turma}</span></span>
                                                )}
                                                {dados?.modalidade && (
                                                    <span>Modalidade: <span className="text-foreground/70">{dados.modalidade}</span></span>
                                                )}
                                                <span>CPF: <span className="text-foreground/70 font-mono">{item.cpf}</span></span>
                                            </div>
                                            {/* Stars */}
                                            {stars > 0 && (
                                                <div className="flex items-center gap-1 mt-1.5">
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className={`w-3 h-3 ${i < stars ? "text-primary fill-primary" : "text-muted-foreground/20"}`}
                                                        />
                                                    ))}
                                                    <span className="text-[10px] text-muted-foreground ml-1">Média geral</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Right: Preview button */}
                                        <button
                                            onClick={() => handlePreview(item.cpf)}
                                            className="flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 px-4 py-2.5 text-xs font-semibold text-primary transition-all duration-200 hover:bg-primary/20 hover:border-primary/40 hover:scale-105 active:scale-95 shrink-0"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                            Preview
                                        </button>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-[10px] text-muted-foreground/40 pt-4 pb-2">
                    Hei Bora Dançar © {new Date().getFullYear()} — Painel Administrativo
                </p>
            </div>
        </main>
    )
}
