"use client"

import { useEffect, useState, useRef, type FormEvent, type ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import { isAdminAuthenticated } from "@/lib/admin-auth"
import { getFirebaseDb, getFirebaseStorage } from "@/lib/firebase-app"
import { ref, set } from "firebase/database"
import { ref as storageRef, uploadBytes } from "firebase/storage"
import { LogoIcon } from "@/components/logo-icon"
import {
    ArrowLeft,
    Shield,
    Star,
    Save,
    CheckCircle2,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    User,
    Music,
    Activity,
    Heart,
    Users,
    Zap,
    MessageSquare,
    Lightbulb,
    FileText,
    ImagePlus,
    X,
} from "lucide-react"

// ── Types ──────────────────────────────────────────────

interface AtributoNotaState {
    nome: string
    valor: number
}

interface AtributoTextoState {
    nome: string
    valor: string
}

interface SugestoesState {
    observacoes: string
    selecionadas: string[]
}

interface DadosAlunoState {
    nomeAluno: string
    dataAvaliacao: string
    modalidade: string
    nivel: string
    periodoAvaliado: string
    professor: string
    turma: string
}

// ── Defaults / Templates ───────────────────────────────

const SUGESTOES_OPCOES = [
    "Aulas particulares",
    "Pratica social/baile",
    "Avançar de nível",
    "Reforço técnico",
]

const MODALIDADES = ["Forró", "Gafieira", "Samba Rock", "Sertanejo", "Zouk", "Bolero", "Salsa", "Bachata"]
const NIVEIS = ["Branco", "Verde", "Laranja", "Lilás", "Azul", "Marrom", "Preto"]
const TURMAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]
const PERIODOS = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

function defaultTecnica(): AtributoNotaState[] {
    return [
        { nome: "Postura e alinhamento corporal", valor: 0 },
        { nome: "Coordenação motora", valor: 0 },
        { nome: "Consciência corporal", valor: 0 },
        { nome: "Base e transferência de peso", valor: 0 },
        { nome: "Equilíbrio", valor: 0 },
        { nome: "Musicalidade (tempo e ritmo)", valor: 0 },
    ]
}

function defaultMovimentos(): AtributoNotaState[] {
    return [
        { nome: "Execução dos passos básicos", valor: 0 },
        { nome: "Execução de giros", valor: 0 },
        { nome: "Fluidez nos movimentos", valor: 0 },
        { nome: "Memorização das sequências", valor: 0 },
    ]
}

function defaultExpressao(): AtributoNotaState[] {
    return [
        { nome: "Expressão corporal", valor: 0 },
        { nome: "Confiança ao dançar", valor: 0 },
        { nome: "Entrega emocional/presença", valor: 0 },
    ]
}

function defaultComportamento(): AtributoNotaState[] {
    return [
        { nome: "Frequência e pontualidade", valor: 0 },
        { nome: "Atenção e foco em aula", valor: 0 },
        { nome: "Abertura para aprender e corrigir", valor: 0 },
        { nome: "Interação com colegas", valor: 0 },
    ]
}

function defaultConexao(): AtributoNotaState[] {
    return [
        { nome: "Conexão com o par", valor: 0 },
        { nome: "Clareza na condução/resposta", valor: 0 },
        { nome: "Sensibilidade ao movimento do par", valor: 0 },
        { nome: "Adaptação a diferentes pares", valor: 0 },
    ]
}

function defaultEvolucao(): AtributoTextoState[] {
    return [
        { nome: "Pontos fortes observados", valor: "" },
        { nome: "Pontos a desenvolver", valor: "" },
    ]
}

function defaultFeedback(): AtributoTextoState[] {
    return [{ nome: "Feedback", valor: "" }]
}

function defaultDados(): DadosAlunoState {
    return {
        nomeAluno: "",
        dataAvaliacao: "",
        modalidade: "",
        nivel: "",
        periodoAvaliado: "",
        professor: "",
        turma: "",
    }
}

function defaultSugestoes(): SugestoesState {
    return { observacoes: "", selecionadas: [] }
}

// ── Helpers ────────────────────────────────────────────

function formatCpfInput(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 11)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

function cpfToDigits(cpf: string): string {
    return cpf.replace(/\D/g, "")
}

// ── Sub-Components ─────────────────────────────────────

function StarRating({
    value,
    onChange,
}: {
    value: number
    onChange: (v: number) => void
}) {
    const [hovered, setHovered] = useState(0)

    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onChange(star)}
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    className="transition-all duration-150 hover:scale-125 active:scale-95 p-0.5"
                    aria-label={`${star} estrela${star > 1 ? "s" : ""}`}
                >
                    <Star
                        className={`w-5 h-5 transition-colors duration-150 ${star <= (hovered || value)
                            ? "text-primary fill-primary drop-shadow-[0_0_6px_rgba(255,106,0,0.6)]"
                            : "text-muted-foreground/25"
                            }`}
                    />
                </button>
            ))}
        </div>
    )
}

function SectionCard({
    title,
    icon: Icon,
    children,
    delay = "animation-delay-100",
    accentColor = "primary",
    defaultOpen = true,
}: {
    title: string
    icon: React.ComponentType<{ className?: string }>
    children: React.ReactNode
    delay?: string
    accentColor?: string
    defaultOpen?: boolean
}) {
    const [open, setOpen] = useState(defaultOpen)

    return (
        <div className={`rounded-2xl bg-card/40 backdrop-blur-xl border border-border/30 shadow-lg shadow-primary/5 overflow-hidden animate-fade-in ${delay}`}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-secondary/20 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl bg-${accentColor}/10 border border-${accentColor}/20 flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 text-${accentColor}`} />
                    </div>
                    <h2 className="text-sm font-bold text-foreground">{title}</h2>
                </div>
                {open ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground/60" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground/60" />
                )}
            </button>

            <div
                className={`transition-all duration-300 ease-in-out ${open ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
                    } overflow-hidden`}
            >
                <div className="px-5 pb-5 pt-1">{children}</div>
            </div>
        </div>
    )
}

function AtributoNotaRow({
    atributo,
    onChange,
}: {
    atributo: AtributoNotaState
    onChange: (valor: number) => void
}) {
    return (
        <div className="flex items-center justify-between gap-3 py-2">
            <span className="text-xs text-foreground/80 flex-1">{atributo.nome}</span>
            <StarRating value={atributo.valor} onChange={onChange} />
        </div>
    )
}

function SelectField({
    id,
    label,
    value,
    onChange,
    options,
    placeholder,
}: {
    id: string
    label: string
    value: string
    onChange: (v: string) => void
    options: string[]
    placeholder: string
}) {
    return (
        <div className="space-y-1.5">
            <label htmlFor={id} className="text-xs font-medium text-foreground/70">
                {label}
            </label>
            <select
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-xl border border-border/50 bg-secondary/50 px-3 py-2.5 text-sm text-foreground outline-none transition-all duration-200 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 backdrop-blur-sm appearance-none cursor-pointer"
            >
                <option value="">{placeholder}</option>
                {options.map((opt) => (
                    <option key={opt} value={opt}>
                        {opt}
                    </option>
                ))}
            </select>
        </div>
    )
}

// ── Validation errors ──────────────────────────────────

interface ValidationErrors {
    cpf?: string
    dados?: Partial<Record<keyof DadosAlunoState, string>>
    tecnica?: string
    movimentos?: string
    expressao?: string
    comportamento?: string
    conexao?: string
    evolucao?: string
    feedback?: string
    sugestoes?: string
}

function validateForm(
    cpf: string,
    dados: DadosAlunoState,
    tecnica: AtributoNotaState[],
    movimentos: AtributoNotaState[],
    expressao: AtributoNotaState[],
    comportamento: AtributoNotaState[],
    conexao: AtributoNotaState[],
    evolucao: AtributoTextoState[],
    feedback: AtributoTextoState[],
): ValidationErrors {
    const errors: ValidationErrors = {}

    // CPF
    if (cpfToDigits(cpf).length !== 11) {
        errors.cpf = "CPF deve conter 11 dígitos."
    }

    // Dados
    const dadosErrors: Partial<Record<keyof DadosAlunoState, string>> = {}
    if (!dados.nomeAluno.trim()) dadosErrors.nomeAluno = "Obrigatório"
    if (!dados.dataAvaliacao.trim()) dadosErrors.dataAvaliacao = "Obrigatório"
    if (!dados.modalidade) dadosErrors.modalidade = "Obrigatório"
    if (!dados.nivel) dadosErrors.nivel = "Obrigatório"
    if (!dados.periodoAvaliado) dadosErrors.periodoAvaliado = "Obrigatório"
    if (!dados.professor.trim()) dadosErrors.professor = "Obrigatório"
    if (!dados.turma) dadosErrors.turma = "Obrigatório"
    if (Object.keys(dadosErrors).length > 0) errors.dados = dadosErrors

    // Star ratings - all must be ≥ 1
    if (tecnica.some((a) => a.valor < 1)) errors.tecnica = "Avalie todos os itens."
    if (movimentos.some((a) => a.valor < 1)) errors.movimentos = "Avalie todos os itens."
    if (expressao.some((a) => a.valor < 1)) errors.expressao = "Avalie todos os itens."
    if (comportamento.some((a) => a.valor < 1)) errors.comportamento = "Avalie todos os itens."
    if (conexao.some((a) => a.valor < 1)) errors.conexao = "Avalie todos os itens."

    // Evolution texts
    if (evolucao.some((e) => !e.valor.trim())) errors.evolucao = "Preencha todos os campos."

    // Feedback
    if (feedback.some((f) => !f.valor.trim())) errors.feedback = "Preencha o feedback."

    return errors
}

// ── Main Page Component ────────────────────────────────

export default function CriarAvaliacaoPage() {
    const router = useRouter()
    const [authenticated, setAuthenticated] = useState(false)

    // Form state
    const [cpf, setCpf] = useState("")
    const [dados, setDados] = useState<DadosAlunoState>(defaultDados())
    const [tecnica, setTecnica] = useState<AtributoNotaState[]>(defaultTecnica())
    const [movimentos, setMovimentos] = useState<AtributoNotaState[]>(defaultMovimentos())
    const [expressao, setExpressao] = useState<AtributoNotaState[]>(defaultExpressao())
    const [comportamento, setComportamento] = useState<AtributoNotaState[]>(defaultComportamento())
    const [conexao, setConexao] = useState<AtributoNotaState[]>(defaultConexao())
    const [evolucao, setEvolucao] = useState<AtributoTextoState[]>(defaultEvolucao())
    const [feedback, setFeedback] = useState<AtributoTextoState[]>(defaultFeedback())
    const [sugestoes, setSugestoes] = useState<SugestoesState>(defaultSugestoes())
    const [fotoFile, setFotoFile] = useState<File | null>(null)
    const [fotoPreview, setFotoPreview] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // UI state
    const [errors, setErrors] = useState<ValidationErrors>({})
    const [saving, setSaving] = useState(false)
    const [success, setSuccess] = useState(false)
    const [globalError, setGlobalError] = useState("")

    useEffect(() => {
        if (!isAdminAuthenticated()) {
            router.replace("/admin")
            return
        }
        setAuthenticated(true)
    }, [router])

    // ── Updaters ──

    function updateDados<K extends keyof DadosAlunoState>(key: K, value: DadosAlunoState[K]) {
        setDados((prev) => ({ ...prev, [key]: value }))
        // Clear specific error
        setErrors((prev) => {
            if (prev.dados?.[key]) {
                const newDados = { ...prev.dados }
                delete newDados[key]
                return { ...prev, dados: Object.keys(newDados).length > 0 ? newDados : undefined }
            }
            return prev
        })
    }

    function updateAtributoNota(
        setter: React.Dispatch<React.SetStateAction<AtributoNotaState[]>>,
        index: number,
        valor: number,
        errorKey: keyof ValidationErrors
    ) {
        setter((prev) => prev.map((a, i) => (i === index ? { ...a, valor } : a)))
        setErrors((prev) => ({ ...prev, [errorKey]: undefined }))
    }

    function updateAtributoTexto(
        setter: React.Dispatch<React.SetStateAction<AtributoTextoState[]>>,
        index: number,
        valor: string,
        errorKey: keyof ValidationErrors
    ) {
        setter((prev) => prev.map((a, i) => (i === index ? { ...a, valor } : a)))
        setErrors((prev) => ({ ...prev, [errorKey]: undefined }))
    }

    function toggleSugestao(opcao: string) {
        setSugestoes((prev) => ({
            ...prev,
            selecionadas: prev.selecionadas.includes(opcao)
                ? prev.selecionadas.filter((s) => s !== opcao)
                : [...prev.selecionadas, opcao],
        }))
    }

    function handleFotoSelect(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith("image/")) return
        setFotoFile(file)
        const reader = new FileReader()
        reader.onloadend = () => setFotoPreview(reader.result as string)
        reader.readAsDataURL(file)
    }

    function removeFoto() {
        setFotoFile(null)
        setFotoPreview(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    // ── Submit ──

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        setGlobalError("")

        const validationErrors = validateForm(
            cpf, dados, tecnica, movimentos, expressao, comportamento, conexao, evolucao, feedback
        )

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors)
            setGlobalError("Preencha todos os campos obrigatórios antes de salvar.")
            // Scroll to top to show the error
            window.scrollTo({ top: 0, behavior: "smooth" })
            return
        }

        setErrors({})
        setSaving(true)

        try {
            const cpfDigits = cpfToDigits(cpf)
            const avaliacaoData = {
                dados,
                tecnica,
                movimentos,
                expressao,
                comportamento,
                conexao,
                evolucao,
                feedback,
                sugestoes,
            }

            await set(ref(getFirebaseDb(), `avaliacoes/${cpfDigits}`), avaliacaoData)

            // Upload photo if selected (optional)
            if (fotoFile) {
                const ext = fotoFile.name.split(".").pop() || "jpg"
                const fotoRef = storageRef(getFirebaseStorage(), `fotos/${cpfDigits}.${ext}`)
                await uploadBytes(fotoRef, fotoFile)
            }
            setSuccess(true)
            // After 2s, redirect to dashboard
            setTimeout(() => {
                router.push("/admin/dashboard")
            }, 2000)
        } catch (error) {
            console.error("Erro ao salvar avaliação:", error)
            setGlobalError("Erro ao salvar avaliação. Tente novamente.")
        } finally {
            setSaving(false)
        }
    }

    if (!authenticated) return null

    // ── Success Screen ──
    if (success) {
        return (
            <main className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-8">
                <div className="fixed inset-0 bg-background" />
                <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,106,0,0.12)_0%,_rgba(255,106,0,0.04)_35%,_transparent_70%)]" />
                <div className="relative z-10 text-center space-y-4 animate-fade-in">
                    <div className="w-16 h-16 mx-auto rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-green-400" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">Avaliação Criada!</h2>
                    <p className="text-sm text-muted-foreground">
                        A avaliação de <strong>{dados.nomeAluno}</strong> foi salva com sucesso.
                    </p>
                    <p className="text-xs text-muted-foreground/60">Redirecionando para o painel...</p>
                </div>
            </main>
        )
    }

    // ── Computed summary ──
    const totalStarFields = tecnica.length + movimentos.length + expressao.length + comportamento.length + conexao.length
    const filledStarFields = [...tecnica, ...movimentos, ...expressao, ...comportamento, ...conexao].filter((a) => a.valor > 0).length
    const totalTextFields = evolucao.length + feedback.length
    const filledTextFields = [...evolucao, ...feedback].filter((a) => a.valor.trim().length > 0).length
    const totalDadosFields = 7 // nomeAluno, dataAvaliacao, modalidade, nivel, periodoAvaliado, professor, turma
    const filledDadosFields = [dados.nomeAluno, dados.dataAvaliacao, dados.modalidade, dados.nivel, dados.periodoAvaliado, dados.professor, dados.turma].filter((v) => v.trim().length > 0).length
    const totalRequired = 1 + totalDadosFields + totalStarFields + totalTextFields // 1 = CPF
    const filledRequired = (cpfToDigits(cpf).length === 11 ? 1 : 0) + filledDadosFields + filledStarFields + filledTextFields
    const progress = Math.round((filledRequired / totalRequired) * 100)

    const inputClass =
        "w-full rounded-xl border border-border/50 bg-secondary/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all duration-200 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 backdrop-blur-sm"

    const errorInputClass =
        "w-full rounded-xl border border-red-500/50 bg-red-500/5 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all duration-200 focus:border-red-500/60 focus:ring-2 focus:ring-red-500/20 backdrop-blur-sm"

    return (
        <main className="relative min-h-screen overflow-hidden px-4 py-8">
            {/* Background */}
            <div className="fixed inset-0 bg-background" />
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,106,0,0.12)_0%,_rgba(255,106,0,0.04)_35%,_transparent_70%)]" />
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,106,0,0.06)_0%,_transparent_50%)]" />

            <form onSubmit={handleSubmit} className="relative z-10 w-full max-w-2xl mx-auto space-y-4">
                {/* Header */}
                <div className="rounded-3xl bg-card/40 backdrop-blur-xl border border-border/30 p-5 shadow-2xl shadow-primary/5 animate-fade-in">
                    <div className="flex items-center justify-between mb-3">
                        <button
                            type="button"
                            onClick={() => router.push("/admin/dashboard")}
                            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted-foreground/60 hover:text-foreground hover:bg-secondary/50 transition-all"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Voltar
                        </button>
                        <LogoIcon />
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-foreground">Criar Avaliação</h1>
                            <p className="text-xs text-muted-foreground">
                                Preencha todos os campos para registrar a avaliação do aluno
                            </p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                                Progresso
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                                {filledRequired}/{totalRequired} campos
                            </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-secondary/60 overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-500 ease-out"
                                style={{
                                    width: `${progress}%`,
                                    background:
                                        progress === 100
                                            ? "linear-gradient(90deg, #22c55e, #4ade80)"
                                            : "linear-gradient(90deg, hsl(24, 100%, 50%), hsl(30, 90%, 55%))",
                                }}
                            />
                        </div>
                    </div>

                    {/* Global Error */}
                    {globalError && (
                        <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/25 px-3 py-2.5">
                            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                            <p className="text-xs text-red-400">{globalError}</p>
                        </div>
                    )}
                </div>

                {/* ── Section 1: Dados do Aluno ── */}
                <SectionCard title="Dados do Aluno" icon={User} delay="animation-delay-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* CPF */}
                        <div className="space-y-1.5 sm:col-span-2">
                            <label htmlFor="cpf-aluno" className="text-xs font-medium text-foreground/70">
                                CPF do Aluno *
                            </label>
                            <input
                                id="cpf-aluno"
                                type="text"
                                inputMode="numeric"
                                autoComplete="off"
                                placeholder="000.000.000-00"
                                value={cpf}
                                onChange={(e) => {
                                    setCpf(formatCpfInput(e.target.value))
                                    setErrors((prev) => ({ ...prev, cpf: undefined }))
                                }}
                                className={errors.cpf ? errorInputClass : inputClass}
                            />
                            {errors.cpf && <p className="text-[10px] text-red-400">{errors.cpf}</p>}
                        </div>

                        {/* Nome */}
                        <div className="space-y-1.5 sm:col-span-2">
                            <label htmlFor="nome-aluno" className="text-xs font-medium text-foreground/70">
                                Nome do Aluno *
                            </label>
                            <input
                                id="nome-aluno"
                                type="text"
                                placeholder="Nome completo do aluno"
                                value={dados.nomeAluno}
                                onChange={(e) => updateDados("nomeAluno", e.target.value)}
                                className={errors.dados?.nomeAluno ? errorInputClass : inputClass}
                            />
                            {errors.dados?.nomeAluno && (
                                <p className="text-[10px] text-red-400">{errors.dados.nomeAluno}</p>
                            )}
                        </div>

                        {/* Data da Avaliação */}
                        <div className="space-y-1.5">
                            <label htmlFor="data-avaliacao" className="text-xs font-medium text-foreground/70">
                                Data da Avaliação *
                            </label>
                            <input
                                id="data-avaliacao"
                                type="text"
                                placeholder="dd/mm/aaaa"
                                value={dados.dataAvaliacao}
                                onChange={(e) => updateDados("dataAvaliacao", e.target.value)}
                                className={errors.dados?.dataAvaliacao ? errorInputClass : inputClass}
                            />
                            {errors.dados?.dataAvaliacao && (
                                <p className="text-[10px] text-red-400">{errors.dados.dataAvaliacao}</p>
                            )}
                        </div>

                        {/* Professor */}
                        <div className="space-y-1.5">
                            <label htmlFor="professor" className="text-xs font-medium text-foreground/70">
                                Professor(a) *
                            </label>
                            <input
                                id="professor"
                                type="text"
                                placeholder="Nome do professor"
                                value={dados.professor}
                                onChange={(e) => updateDados("professor", e.target.value)}
                                className={errors.dados?.professor ? errorInputClass : inputClass}
                            />
                            {errors.dados?.professor && (
                                <p className="text-[10px] text-red-400">{errors.dados.professor}</p>
                            )}
                        </div>

                        {/* Modalidade */}
                        <SelectField
                            id="modalidade"
                            label="Modalidade *"
                            value={dados.modalidade}
                            onChange={(v) => updateDados("modalidade", v)}
                            options={MODALIDADES}
                            placeholder="Selecione..."
                        />

                        {/* Nível */}
                        <SelectField
                            id="nivel"
                            label="Nível *"
                            value={dados.nivel}
                            onChange={(v) => updateDados("nivel", v)}
                            options={NIVEIS}
                            placeholder="Selecione..."
                        />

                        {/* Turma */}
                        <SelectField
                            id="turma"
                            label="Turma *"
                            value={dados.turma}
                            onChange={(v) => updateDados("turma", v)}
                            options={TURMAS}
                            placeholder="Selecione..."
                        />

                        {/* Período Avaliado */}
                        <SelectField
                            id="periodo"
                            label="Período Avaliado *"
                            value={dados.periodoAvaliado}
                            onChange={(v) => updateDados("periodoAvaliado", v)}
                            options={PERIODOS}
                            placeholder="Selecione..."
                        />

                        {/* Foto do Aluno (opcional) */}
                        <div className="sm:col-span-2 space-y-1.5 mt-1">
                            <label className="text-xs font-medium text-foreground/70">
                                Foto do Aluno <span className="text-muted-foreground/50 font-normal">(opcional)</span>
                            </label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFotoSelect}
                                className="hidden"
                                id="foto-aluno"
                            />

                            {fotoPreview ? (
                                <div className="relative group w-full rounded-xl border border-border/50 bg-secondary/30 p-3 flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-border/30 shrink-0">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={fotoPreview}
                                            alt="Preview da foto"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-foreground truncate">{fotoFile?.name}</p>
                                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                                            {fotoFile ? `${(fotoFile.size / 1024).toFixed(1)} KB` : ""}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={removeFoto}
                                        className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-all shrink-0"
                                        title="Remover foto"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full rounded-xl border-2 border-dashed border-border/40 bg-secondary/20 hover:bg-secondary/40 hover:border-primary/30 transition-all duration-200 px-4 py-6 flex flex-col items-center gap-2 group cursor-pointer"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <ImagePlus className="w-5 h-5 text-primary/70" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-foreground/70 font-medium">Clique para enviar uma foto</p>
                                        <p className="text-[10px] text-muted-foreground/50 mt-0.5">JPG, PNG ou WebP</p>
                                    </div>
                                </button>
                            )}
                        </div>
                    </div>
                </SectionCard>

                {/* ── Section 2: Técnica ── */}
                <SectionCard title="Técnica" icon={Activity} delay="animation-delay-200" defaultOpen={false}>
                    <div className="divide-y divide-border/20">
                        {tecnica.map((attr, i) => (
                            <AtributoNotaRow
                                key={attr.nome}
                                atributo={attr}
                                onChange={(v) => updateAtributoNota(setTecnica, i, v, "tecnica")}
                            />
                        ))}
                    </div>
                    {errors.tecnica && (
                        <p className="text-[10px] text-red-400 mt-2 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {errors.tecnica}
                        </p>
                    )}
                </SectionCard>

                {/* ── Section 3: Movimentos ── */}
                <SectionCard title="Movimentos" icon={Zap} delay="animation-delay-200" defaultOpen={false}>
                    <div className="divide-y divide-border/20">
                        {movimentos.map((attr, i) => (
                            <AtributoNotaRow
                                key={attr.nome}
                                atributo={attr}
                                onChange={(v) => updateAtributoNota(setMovimentos, i, v, "movimentos")}
                            />
                        ))}
                    </div>
                    {errors.movimentos && (
                        <p className="text-[10px] text-red-400 mt-2 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {errors.movimentos}
                        </p>
                    )}
                </SectionCard>

                {/* ── Section 4: Expressão ── */}
                <SectionCard title="Expressão" icon={Heart} delay="animation-delay-300" defaultOpen={false}>
                    <div className="divide-y divide-border/20">
                        {expressao.map((attr, i) => (
                            <AtributoNotaRow
                                key={attr.nome}
                                atributo={attr}
                                onChange={(v) => updateAtributoNota(setExpressao, i, v, "expressao")}
                            />
                        ))}
                    </div>
                    {errors.expressao && (
                        <p className="text-[10px] text-red-400 mt-2 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {errors.expressao}
                        </p>
                    )}
                </SectionCard>

                {/* ── Section 5: Comportamento ── */}
                <SectionCard title="Comportamento" icon={Users} delay="animation-delay-300" defaultOpen={false}>
                    <div className="divide-y divide-border/20">
                        {comportamento.map((attr, i) => (
                            <AtributoNotaRow
                                key={attr.nome}
                                atributo={attr}
                                onChange={(v) => updateAtributoNota(setComportamento, i, v, "comportamento")}
                            />
                        ))}
                    </div>
                    {errors.comportamento && (
                        <p className="text-[10px] text-red-400 mt-2 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {errors.comportamento}
                        </p>
                    )}
                </SectionCard>

                {/* ── Section 6: Conexão ── */}
                <SectionCard title="Conexão" icon={Music} delay="animation-delay-400" defaultOpen={false}>
                    <div className="divide-y divide-border/20">
                        {conexao.map((attr, i) => (
                            <AtributoNotaRow
                                key={attr.nome}
                                atributo={attr}
                                onChange={(v) => updateAtributoNota(setConexao, i, v, "conexao")}
                            />
                        ))}
                    </div>
                    {errors.conexao && (
                        <p className="text-[10px] text-red-400 mt-2 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {errors.conexao}
                        </p>
                    )}
                </SectionCard>

                {/* ── Section 7: Evolução ── */}
                <SectionCard title="Evolução" icon={FileText} delay="animation-delay-400" defaultOpen={false}>
                    <div className="space-y-4">
                        {evolucao.map((campo, i) => (
                            <div key={campo.nome} className="space-y-1.5">
                                <label className="text-xs font-medium text-foreground/70">
                                    {campo.nome} *
                                </label>
                                <textarea
                                    value={campo.valor}
                                    onChange={(e) => updateAtributoTexto(setEvolucao, i, e.target.value, "evolucao")}
                                    placeholder={`Descreva ${campo.nome.toLowerCase()}...`}
                                    rows={3}
                                    className={`${inputClass} resize-none`}
                                />
                            </div>
                        ))}
                    </div>
                    {errors.evolucao && (
                        <p className="text-[10px] text-red-400 mt-2 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {errors.evolucao}
                        </p>
                    )}
                </SectionCard>

                {/* ── Section 8: Feedback ── */}
                <SectionCard title="Feedback" icon={MessageSquare} delay="animation-delay-500" defaultOpen={false}>
                    <div className="space-y-4">
                        {feedback.map((campo, i) => (
                            <div key={campo.nome} className="space-y-1.5">
                                <label className="text-xs font-medium text-foreground/70">
                                    {campo.nome} *
                                </label>
                                <textarea
                                    value={campo.valor}
                                    onChange={(e) => updateAtributoTexto(setFeedback, i, e.target.value, "feedback")}
                                    placeholder="Escreva o feedback para o aluno..."
                                    rows={4}
                                    className={`${inputClass} resize-none`}
                                />
                            </div>
                        ))}
                    </div>
                    {errors.feedback && (
                        <p className="text-[10px] text-red-400 mt-2 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {errors.feedback}
                        </p>
                    )}
                </SectionCard>

                {/* ── Section 9: Sugestões ── */}
                <SectionCard title="Sugestões" icon={Lightbulb} delay="animation-delay-500" defaultOpen={false}>
                    <div className="space-y-4">
                        {/* Toggle options */}
                        <div>
                            <p className="text-xs font-medium text-foreground/70 mb-2">Sugestões selecionadas</p>
                            <div className="flex flex-wrap gap-2">
                                {SUGESTOES_OPCOES.map((opcao) => {
                                    const selected = sugestoes.selecionadas.includes(opcao)
                                    return (
                                        <button
                                            key={opcao}
                                            type="button"
                                            onClick={() => toggleSugestao(opcao)}
                                            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${selected
                                                ? "bg-primary/15 text-primary border-primary/30 shadow-[0_0_12px_rgba(255,106,0,0.15)]"
                                                : "bg-secondary/30 text-muted-foreground border-border/40 hover:border-primary/30 hover:text-foreground"
                                                }`}
                                        >
                                            {selected && <span className="mr-1">✓</span>}
                                            {opcao}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Observações */}
                        <div className="space-y-1.5">
                            <label htmlFor="observacoes" className="text-xs font-medium text-foreground/70">
                                Observações
                            </label>
                            <textarea
                                id="observacoes"
                                value={sugestoes.observacoes}
                                onChange={(e) =>
                                    setSugestoes((prev) => ({ ...prev, observacoes: e.target.value }))
                                }
                                placeholder="Observações adicionais sobre o aluno..."
                                rows={3}
                                className={`${inputClass} resize-none`}
                            />
                        </div>
                    </div>
                </SectionCard>

                {/* ── Submit Button ── */}
                <div className="rounded-3xl bg-card/40 backdrop-blur-xl border border-border/30 p-5 shadow-2xl shadow-primary/5 animate-fade-in animation-delay-600">
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full rounded-xl bg-gradient-to-r from-primary to-orange-500 px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/25"
                    >
                        {saving ? (
                            <span className="inline-flex items-center gap-2 justify-center">
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                                Salvando...
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-2 justify-center">
                                <Save className="w-4 h-4" />
                                Salvar Avaliação
                            </span>
                        )}
                    </button>

                    {progress < 100 && (
                        <p className="text-center text-[10px] text-muted-foreground/50 mt-2">
                            Preencha todos os campos obrigatórios para salvar
                        </p>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-[10px] text-muted-foreground/40 pt-2 pb-4">
                    Hei Bora Dançar © {new Date().getFullYear()} — Painel Administrativo
                </p>
            </form>
        </main >
    )
}
