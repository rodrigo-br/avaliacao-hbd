"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { isAdminAuthenticated, logoutAdmin, getAdminCredentials, getAdminName } from "@/lib/admin-auth"
import { getAdminsListAction } from "@/lib/admin-actions"
import { getFirebaseDb } from "@/lib/firebase-app"
import { ref, get, set } from "firebase/database"
import { calcularMedia, getAvaliacaoMaisRecente, type Avaliacao } from "@/lib/firebase"
import { LogoIcon } from "@/components/logo-icon"
import { LogOut, Shield, Eye, Users, Search, Star, Plus, KeyRound, CheckSquare, Square, ClipboardList, PenTool, UserCog, ChevronDown, ChevronUp } from "lucide-react"
import { AdminStudentAvatar } from "@/components/admin-student-avatar"

interface AvaliacaoComCpf {
    cpf: string
    avaliacao: Avaliacao
    totalPeriodos: number
    agendado: boolean
    avaliadorId: string | null
}

export default function AdminDashboardPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [avaliacoes, setAvaliacoes] = useState<AvaliacaoComCpf[]>([])
    const [search, setSearch] = useState("")
    const [authenticated, setAuthenticated] = useState(false)
    const [resetRequests, setResetRequests] = useState<Set<string>>(new Set())
    const [confirmResetCpf, setConfirmResetCpf] = useState<string | null>(null)
    const [confirmResetName, setConfirmResetName] = useState("")
    const [resetting, setResetting] = useState(false)

    // Super Admin state
    const [isSuperAdmin, setIsSuperAdmin] = useState(false)
    const [admins, setAdmins] = useState<{ cpf: string; nome: string }[]>([])
    const [activeTab, setActiveTab] = useState<"todos" | "agendadas" | "avaliadores">("todos")
    const [expandedAdmin, setExpandedAdmin] = useState<string | null>(null)
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null) // CPF of student being updated

    useEffect(() => {
        if (!isAdminAuthenticated()) {
            router.replace("/admin")
            return
        }
        setAuthenticated(true)

        async function loadData() {
            try {
                const { cpf: adminCpf, password: adminPassword } = getAdminCredentials()
                const digitsCpf = adminCpf.replace(/\D/g, "")
                const isSuper = ["00000000000", "43736307802"].includes(digitsCpf)
                setIsSuperAdmin(isSuper)

                if (isSuper) {
                    const adminsList = await getAdminsListAction(adminCpf, adminPassword)
                    setAdmins(adminsList)
                }

                // Load evaluations
                const snapshot = await get(ref(getFirebaseDb(), "avaliacoes"))
                if (snapshot.exists()) {
                    const data = snapshot.val() as Record<string, any>
                    const list: AvaliacaoComCpf[] = []
                    
                    for (const [cpf, content] of Object.entries(data)) {
                        const resultado = getAvaliacaoMaisRecente(content)
                        const dados = content.dados || resultado?.avaliacao?.dados || {}
                        const agendamento = content.agendamento || {}

                        // Apenas mostre se tiver nomeAluno ou avaliação existente
                        if (dados.nomeAluno || resultado) {
                            list.push({
                                cpf,
                                avaliacao: resultado?.avaliacao || ({ dados } as Avaliacao),
                                totalPeriodos: Object.keys(content).filter((k) => /^\d{4}-\d{2}$/.test(k)).length,
                                agendado: !!agendamento.agendado,
                                avaliadorId: agendamento.avaliador || null,
                            })
                        }
                    }
                    list.sort((a, b) =>
                        (a.avaliacao.dados?.nomeAluno ?? "").localeCompare(b.avaliacao.dados?.nomeAluno ?? "")
                    )
                    setAvaliacoes(list)
                }

                // Load reset requests via server API
                const resetRes = await fetch("/api/admin/reset-requests", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ adminCpf, adminPassword }),
                })
                if (resetRes.ok) {
                    const resetData = await resetRes.json()
                    setResetRequests(new Set(resetData.cpfs))
                }
            } catch (error) {
                console.error("Erro ao carregar avaliações/admins:", error)
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

    function handleStartEvaluation(cpf: string, nome: string) {
        router.push(`/admin/criar-avaliacao?cpf=${cpf}&nome=${encodeURIComponent(nome)}`)
    }

    async function toggleAgendamento(cpf: string, currentAgendado: boolean) {
        setUpdatingStatus(cpf)
        try {
            const newAgendado = !currentAgendado
            const dbRef = ref(getFirebaseDb(), `avaliacoes/${cpf}/agendamento/agendado`)
            await set(dbRef, newAgendado)
            
            // Updates locally
            setAvaliacoes(prev => prev.map(a => a.cpf === cpf ? { ...a, agendado: newAgendado, avaliadorId: newAgendado ? a.avaliadorId : null } : a))
            
            // If we're unchecked agendado, also remove the assignee in DB to be clean
            if (!newAgendado) {
                const assigneeRef = ref(getFirebaseDb(), `avaliacoes/${cpf}/agendamento/avaliador`)
                await set(assigneeRef, null)
            }
        } catch (error) {
            console.error("Erro ao atualizar agendamento:", error)
        } finally {
            setUpdatingStatus(null)
        }
    }

    async function assignAvaliador(cpf: string, adminCpf: string | null) {
        setUpdatingStatus(cpf)
        try {
            const assigneeRef = ref(getFirebaseDb(), `avaliacoes/${cpf}/agendamento/avaliador`)
            await set(assigneeRef, adminCpf)
            setAvaliacoes(prev => prev.map(a => a.cpf === cpf ? { ...a, avaliadorId: adminCpf } : a))
        } catch (error) {
            console.error("Erro ao atribuir avaliador:", error)
        } finally {
            setUpdatingStatus(null)
        }
    }

    function openResetConfirm(cpf: string, nome: string) {
        setConfirmResetCpf(cpf)
        setConfirmResetName(nome)
    }

    function closeResetConfirm() {
        setConfirmResetCpf(null)
        setConfirmResetName("")
    }

    async function handleResetPassword() {
        if (!confirmResetCpf) return
        setResetting(true)

        try {
            const { cpf: adminCpf, password: adminPassword } = getAdminCredentials()

            const res = await fetch("/api/admin/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cpf: confirmResetCpf,
                    adminCpf,
                    adminPassword,
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                alert(`Erro ao resetar senha: ${data.error}`)
                return
            }

            setResetRequests((prev) => {
                const next = new Set(prev)
                next.delete(confirmResetCpf!)
                return next
            })

            alert(`Senha resetada com sucesso para ${confirmResetName}!`)
            closeResetConfirm()
        } catch (error) {
            console.error("Erro no reset:", error)
            alert("Erro ao resetar senha.")
        } finally {
            setResetting(false)
        }
    }

    // ── Filter logic ──
    const searchFilter = (item: AvaliacaoComCpf) => {
        if (!search) return true
        const q = search.toLowerCase()
        const nome = (item.avaliacao.dados?.nomeAluno ?? "").toLowerCase()
        const turma = (item.avaliacao.dados?.turma ?? "").toLowerCase()
        const modalidade = (item.avaliacao.dados?.modalidade ?? "").toLowerCase()
        const nivel = (item.avaliacao.dados?.nivel ?? "").toLowerCase()
        const cpf = item.cpf.toLowerCase()
        return nome.includes(q) || turma.includes(q) || modalidade.includes(q) || nivel.includes(q) || cpf.includes(q)
    }

    // Filter to define what goes into the active list
    let visibleAvaliacoes = avaliacoes.filter(searchFilter)

    if (isSuperAdmin) {
        if (activeTab === "agendadas") {
            visibleAvaliacoes = visibleAvaliacoes.filter(a => a.agendado)
        }
    } else {
        // Regular Admin: sees only what is assigned to them
        const myCpf = getAdminCredentials().cpf.replace(/\D/g, "")
        visibleAvaliacoes = visibleAvaliacoes.filter(a => a.agendado && a.avaliadorId === myCpf)
    }

    // ── Compute overall average stars for each avaliacao ──
    function overallStars(av: Avaliacao): number {
        if (!av.tecnica && !av.movimentos && !av.expressao) return 0 // Empty generic evaluation
        const categories = [av.tecnica, av.movimentos, av.expressao, av.comportamento, av.conexao]
        const medias = categories.map((c) => calcularMedia(c ?? []))
        const valid = medias.filter((m) => m > 0)
        if (valid.length === 0) return 0
        return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length)
    }

    function levelBadgeClass(nivel: string): string {
        switch (nivel) {
            case "Verde": return "bg-green-500/15 text-green-400 border-green-500/30"
            case "Laranja": return "bg-orange-500/15 text-orange-400 border-orange-500/30"
            case "Lilás": return "bg-purple-500/15 text-purple-400 border-purple-500/30"
            default: return "bg-primary/15 text-primary border-primary/30"
        }
    }

    if (!authenticated) return null

    if (loading) {
        return (
            <main className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-8">
                <div className="fixed inset-0 bg-background" />
                <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,106,0,0.12)_0%,_rgba(255,106,0,0.04)_35%,_transparent_70%)]" />
                <div className="relative z-10 text-center space-y-3">
                    <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                    <p className="text-sm text-muted-foreground">Carregando painel...</p>
                </div>
            </main>
        )
    }

    return (
        <main className="relative min-h-screen overflow-hidden px-4 py-8">
            <div className="fixed inset-0 bg-background" />
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,106,0,0.12)_0%,_rgba(255,106,0,0.04)_35%,_transparent_70%)]" />
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,106,0,0.06)_0%,_transparent_50%)]" />

            <div className="relative z-10 w-full max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <div className="rounded-3xl bg-card/40 backdrop-blur-xl border border-border/30 p-6 shadow-2xl shadow-primary/5 animate-fade-in">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <LogoIcon />
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-lg font-bold text-foreground">
                                        {isSuperAdmin ? "Super Admin" : "Painel Avaliador"}
                                    </h1>
                                    <div className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${isSuperAdmin ? "bg-purple-500/10 border-purple-500/30" : "bg-primary/10 border-primary/20"}`}>
                                        {isSuperAdmin ? <UserCog className="w-3 h-3 text-purple-400" /> : <Shield className="w-3 h-3 text-primary" />}
                                        <span className={`text-[10px] font-semibold uppercase tracking-wider ${isSuperAdmin ? "text-purple-400" : "text-primary"}`}>
                                            {isSuperAdmin ? "Super" : "Admin"}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {isSuperAdmin ? "Gerenciamento e distribuição de avaliações" : "Sua lista de alunos aguardando avaliação"}
                                </p>
                                {getAdminName() && !isSuperAdmin && (
                                    <p className="text-[10px] text-primary/70 mt-0.5">
                                        Logado como <strong>{getAdminName()}</strong>
                                    </p>
                                )}
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

                {/* Super Admin Tabs */}
                {isSuperAdmin && (
                    <div className="flex items-center bg-card/40 backdrop-blur-xl border border-border/30 rounded-2xl p-1 shadow-lg shadow-primary/5 mx-auto w-fit max-w-full overflow-x-auto animate-fade-in">
                        <button
                            onClick={() => setActiveTab("todos")}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shrink-0 ${activeTab === "todos" ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-secondary/50 text-muted-foreground"}`}
                        >
                            <Users className="w-4 h-4" /> Todos os Alunos
                        </button>
                        <button
                            onClick={() => setActiveTab("agendadas")}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shrink-0 ${activeTab === "agendadas" ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-secondary/50 text-muted-foreground"}`}
                        >
                            <ClipboardList className="w-4 h-4" /> Avaliações Agendadas
                        </button>
                        <button
                            onClick={() => setActiveTab("avaliadores")}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shrink-0 ${activeTab === "avaliadores" ? "bg-purple-500 text-white shadow-sm" : "hover:bg-secondary/50 text-muted-foreground"}`}
                        >
                            <Shield className="w-4 h-4" /> Avaliadores
                        </button>
                    </div>
                )}

                {/* Search Bar + Create Button (Only if not in "Avaliadores" tab) */}
                {(!isSuperAdmin || activeTab !== "avaliadores") && (
                    <div className="flex flex-col sm:flex-row gap-4 animate-fade-in animation-delay-100">
                        <div className="flex gap-3">
                            <div className="rounded-2xl bg-card/40 backdrop-blur-xl border border-border/30 px-4 py-3 shadow-lg shadow-primary/5 flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                    <ClipboardList className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-foreground">{visibleAvaliacoes.length}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{isSuperAdmin && activeTab === 'todos' ? 'Alunos' : 'Na lista'}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => router.push("/admin/criar-avaliacao")}
                                className="rounded-2xl bg-gradient-to-r from-primary to-orange-500 px-5 py-3 shadow-lg shadow-primary/20 flex items-center gap-2 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:brightness-110 hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">Criar Avaliação</span>
                            </button>
                        </div>
                        <div className="flex-1 relative">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                <Search className="w-4 h-4 text-muted-foreground/50" />
                            </div>
                            <input
                                type="text"
                                placeholder="Buscar por nome, turma, modalidade..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all duration-200 focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>
                )}

                {/* Main List Rendering */}
                {isSuperAdmin && activeTab === "avaliadores" ? (
                    /* ──────────────── AVALIADORES TAB (SUPER ADMIN) ──────────────── */
                    <div className="space-y-4 animate-fade-in animation-delay-200">
                        {admins.map((admin) => {
                            const adminStudents = avaliacoes.filter(a => a.agendado && a.avaliadorId === admin.cpf)
                            const isExpanded = expandedAdmin === admin.cpf

                            return (
                                <div key={admin.cpf} className="rounded-2xl bg-card/40 backdrop-blur-xl border border-border/30 overflow-hidden shadow-lg shadow-primary/5 transition-all">
                                    <button
                                        onClick={() => setExpandedAdmin(isExpanded ? null : admin.cpf)}
                                        className="w-full flex items-center justify-between p-4 hover:bg-secondary/20 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
                                                <Shield className="w-5 h-5 text-purple-400" />
                                            </div>
                                            <div className="text-left">
                                                <h3 className="text-base font-bold text-foreground">{admin.nome}</h3>
                                                <p className="text-[11px] text-muted-foreground">CPF: <span className="font-mono">{admin.cpf}</span></p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="inline-flex items-center rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 px-3 py-1 text-xs font-semibold">
                                                {adminStudents.length} {adminStudents.length === 1 ? 'aluno' : 'alunos'}
                                            </span>
                                            {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground/50" /> : <ChevronDown className="w-5 h-5 text-muted-foreground/50" />}
                                        </div>
                                    </button>
                                    
                                    {isExpanded && (
                                        <div className="p-4 border-t border-border/20 bg-black/10">
                                            {adminStudents.length === 0 ? (
                                                <p className="text-sm text-muted-foreground text-center py-4">Nenhum aluno atribuído.</p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {adminStudents.map(student => (
                                                        <div key={student.cpf} className="flex items-center justify-between p-3 rounded-xl bg-card/50 border border-border/30 text-sm">
                                                            <div className="flex items-center gap-3">
                                                                <AdminStudentAvatar cpf={student.cpf} nome={student.avaliacao.dados?.nomeAluno ?? "Sem nome"} hasPicture={student.avaliacao.dados?.hasPicture} />
                                                                <div>
                                                                    <p className="font-semibold text-foreground">{student.avaliacao.dados?.nomeAluno}</p>
                                                                    <p className="text-[10px] text-muted-foreground font-mono">{student.cpf}</p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => assignAvaliador(student.cpf, null)}
                                                                disabled={updatingStatus === student.cpf}
                                                                className="px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors text-xs font-medium disabled:opacity-50"
                                                            >
                                                                Remover
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    /* ──────────────── ALUNOS / AVALIAÇÕES (SUPER & REGULAR ADMIN) ──────────────── */
                    <div className="space-y-3 animate-fade-in animation-delay-200">
                        {visibleAvaliacoes.length === 0 ? (
                            <div className="rounded-2xl bg-card/40 backdrop-blur-xl border border-border/30 p-8 text-center">
                                <p className="text-3xl mb-2">🔍</p>
                                <p className="text-sm text-muted-foreground">Nenhum resultado encontrado.</p>
                            </div>
                        ) : (
                            visibleAvaliacoes.map((item, index) => {
                                const dados = item.avaliacao.dados
                                const stars = overallStars(item.avaliacao)
                                const hasPendingReset = resetRequests.has(item.cpf)
                                const isLoading = updatingStatus === item.cpf

                                return (
                                    <div
                                        key={item.cpf}
                                        className={`group rounded-2xl bg-card/40 backdrop-blur-xl border p-4 shadow-lg transition-all duration-300 hover:bg-card/60 ${item.agendado ? "border-primary/40 shadow-primary/10" : "border-border/30"}`}
                                        style={{ animationDelay: `${Math.min(index * 50, 500)}ms` }}
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                                            {/* Top / Left: Info */}
                                            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                                                {/* Super Admin Checkbox */}
                                                {isSuperAdmin && (
                                                    <button
                                                        onClick={() => toggleAgendamento(item.cpf, item.agendado)}
                                                        disabled={isLoading}
                                                        className="shrink-0 transition-transform active:scale-95 disabled:opacity-50"
                                                    >
                                                        {item.agendado ? (
                                                            <CheckSquare className="w-6 h-6 text-primary fill-primary/20" />
                                                        ) : (
                                                            <Square className="w-6 h-6 text-muted-foreground/50 hover:text-primary/70 transition-colors" />
                                                        )}
                                                    </button>
                                                )}
                                                
                                                <AdminStudentAvatar cpf={item.cpf} nome={dados?.nomeAluno ?? "Sem nome"} hasPicture={dados?.hasPicture} />
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
                                                        {item.totalPeriodos > 0 && (
                                                            <span className="inline-flex items-center rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 px-2 py-0.5 text-[10px] font-semibold">
                                                                {item.totalPeriodos} avaliação(ões)
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground flex-wrap">
                                                        {dados?.turma && (
                                                            <span>Turma: <span className="text-foreground/70">{dados.turma}</span></span>
                                                        )}
                                                        <span>CPF: <span className="text-foreground/70 font-mono">{item.cpf}</span></span>
                                                    </div>
                                                    
                                                    {/* Assign Selector (Super Admin - Agendadas tab) */}
                                                    {isSuperAdmin && activeTab === "agendadas" && item.agendado && (
                                                        <div className="mt-2 flex items-center gap-2">
                                                            <span className="text-[10px] text-muted-foreground">Avaliador:</span>
                                                            <select
                                                                value={item.avaliadorId || ""}
                                                                onChange={(e) => assignAvaliador(item.cpf, e.target.value || null)}
                                                                disabled={isLoading}
                                                                className="bg-secondary/50 border border-border/50 text-xs text-foreground rounded-lg px-2 py-1 outline-none focus:border-primary/50"
                                                            >
                                                                <option value="">Não atribuído</option>
                                                                {admins.map(adm => (
                                                                    <option key={adm.cpf} value={adm.cpf}>{adm.nome}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Bottom / Right: Action Buttons */}
                                            <div className="flex items-center gap-2 sm:shrink-0 border-t border-border/20 pt-2 sm:border-0 sm:pt-0">
                                                {/* Super Admin sees "Reset/Preview" */}
                                                {isSuperAdmin ? (
                                                    <>
                                                        <button
                                                            onClick={() => openResetConfirm(item.cpf, dados?.nomeAluno ?? "Sem nome")}
                                                            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${hasPendingReset ? "bg-red-500/15 border-red-500/40 text-red-400 hover:bg-red-500/25 animate-pulse" : "bg-secondary/50 border-border/50 text-muted-foreground hover:bg-secondary/80 hover:text-foreground"}`}
                                                        >
                                                            <KeyRound className="w-3.5 h-3.5" /> Reset
                                                        </button>
                                                        {item.totalPeriodos > 0 && (
                                                            <button
                                                                onClick={() => handlePreview(item.cpf)}
                                                                className="flex items-center justify-center gap-1.5 rounded-xl bg-primary/10 border border-primary/20 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20 hover:scale-105 transition-all"
                                                            >
                                                                <Eye className="w-3.5 h-3.5" /> Preview
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleStartEvaluation(item.cpf, dados?.nomeAluno ?? "Sem nome")}
                                                            className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-orange-500 px-3 py-2 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                                                        >
                                                            <PenTool className="w-3.5 h-3.5" /> Avaliar
                                                        </button>
                                                    </>
                                                ) : (
                                                    /* Regular Admin sees "Iniciar Avaliação" */
                                                    <button
                                                        onClick={() => handleStartEvaluation(item.cpf, dados?.nomeAluno ?? "Sem nome")}
                                                        className="flex flex-1 sm:flex-none w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-orange-500 px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                                                    >
                                                        <PenTool className="w-4 h-4" /> INICIAR AVALIAÇÃO
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                )}

                <p className="text-center text-[10px] text-muted-foreground/40 pt-4 pb-2">
                    Hei Bora Dançar © {new Date().getFullYear()} — Painel Administrativo
                </p>
            </div>

            {/* Modal de Reset (Somente Super Admin, mas usamos o estado igual) */}
            {confirmResetCpf && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeResetConfirm} />
                    <div className="relative z-10 max-w-sm w-[90%] bg-card rounded-2xl border border-border/50 p-6 shadow-2xl animate-fade-in">
                        <div className="text-center space-y-4">
                            <div className="w-12 h-12 mx-auto rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                <KeyRound className="w-6 h-6 text-red-400" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-foreground mb-1">Resetar Senha</h3>
                                <p className="text-sm text-muted-foreground">
                                    Tem certeza que deseja resetar a senha de <strong className="text-foreground">{confirmResetName}</strong>?
                                </p>
                            </div>
                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={closeResetConfirm}
                                    className="flex-1 rounded-xl border bg-secondary/30 px-4 py-2 text-sm font-semibold hover:bg-secondary/60"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleResetPassword}
                                    disabled={resetting}
                                    className="flex-1 rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50"
                                >
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}
