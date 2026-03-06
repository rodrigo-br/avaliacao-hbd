// =============================================================
// Firebase Realtime Database - REST API (sem SDK necessário)
// =============================================================
// Como as regras do seu banco estão públicas, basta fazer
// um fetch na URL do Firebase adicionando ".json" no final.
// =============================================================

// 🔧 SUBSTITUA pela URL do seu projeto Firebase:
const FIREBASE_DB_URL = "https://donzelord-default-rtdb.firebaseio.com/"

// ----- Tipos baseados na estrutura do banco -----

export interface DadosAluno {
    dataAvaliacao: string
    modalidade: string
    nivel: string
    nomeAluno: string
    periodoAvaliado: string
    professor: string
    turma: string
}

export interface AtributoNota {
    nome: string
    valor: number
}

export interface AtributoTexto {
    nome: string
    valor: string
}

export interface Sugestoes {
    observacoes: string
    selecionadas: string[]
}

export interface Avaliacao {
    dados: DadosAluno
    tecnica: AtributoNota[]
    movimentos: AtributoNota[]
    expressao: AtributoNota[]
    comportamento: AtributoNota[]
    conexao: AtributoNota[]
    evolucao: AtributoTexto[]
    feedback: AtributoTexto[]
    sugestoes: Sugestoes
}

/** Mapa de avaliações de um aluno: chave é "YYYY-MM", valor é a Avaliacao */
export type AvaliacoesDoAluno = Record<string, Avaliacao>

// ----- Mapa de meses -----

const MESES_PARA_NUMERO: Record<string, string> = {
    Janeiro: "01", Fevereiro: "02", "Março": "03", Abril: "04",
    Maio: "05", Junho: "06", Julho: "07", Agosto: "08",
    Setembro: "09", Outubro: "10", Novembro: "11", Dezembro: "12",
}

const NUMERO_PARA_MES: Record<string, string> = Object.fromEntries(
    Object.entries(MESES_PARA_NUMERO).map(([k, v]) => [v, k])
)

// ----- Funções auxiliares de período -----

/**
 * Gera a chave YYYY-MM a partir dos dados do aluno.
 * Usa `periodoAvaliado` para o mês e `dataAvaliacao` para o ano.
 */
export function gerarChavePeriodo(dados: DadosAluno): string {
    const mes = MESES_PARA_NUMERO[dados.periodoAvaliado] ?? "01"
    const matchAno = dados.dataAvaliacao?.match(/(\d{4})/)
    const ano = matchAno ? matchAno[1] : new Date().getFullYear().toString()
    return `${ano}-${mes}`
}

/**
 * Converte uma chave "YYYY-MM" para um label legível, ex: "Janeiro 2026".
 */
export function formatarPeriodo(chave: string): string {
    const [ano, mes] = chave.split("-")
    const nomeMes = NUMERO_PARA_MES[mes] ?? mes
    return `${nomeMes} ${ano}`
}

/**
 * Retorna a lista de períodos ordenados (mais recente primeiro).
 * Filtra apenas chaves no formato YYYY-MM (ignora campos como senha_criada).
 */
export function listarPeriodos(avaliacoes: AvaliacoesDoAluno): string[] {
    return Object.keys(avaliacoes)
        .filter((k) => /^\d{4}-\d{2}$/.test(k))
        .sort()
        .reverse()
}

/**
 * Retorna a avaliação mais recente do mapa de avaliações.
 */
export function getAvaliacaoMaisRecente(avaliacoes: AvaliacoesDoAluno): { periodo: string; avaliacao: Avaliacao } | null {
    const periodos = listarPeriodos(avaliacoes)
    if (periodos.length === 0) return null
    const periodo = periodos[0]
    return { periodo, avaliacao: avaliacoes[periodo] }
}

// ----- Funções de busca -----

/**
 * Busca todas as avaliações do Firebase.
 * Retorna Record<cpf, Record<YYYY-MM, Avaliacao>>.
 */
export async function fetchAvaliacoes(): Promise<Record<string, AvaliacoesDoAluno>> {
    const res = await fetch(`${FIREBASE_DB_URL}/avaliacoes.json`, {
        next: { revalidate: 60 }, // ISR: revalida a cada 60 segundos
    })

    if (!res.ok) {
        throw new Error(`Erro ao buscar dados do Firebase: ${res.statusText}`)
    }

    const data = await res.json()
    return data ?? {}
}

/**
 * Busca todas as avaliações de um aluno pelo CPF.
 * Retorna Record<YYYY-MM, Avaliacao> ou null.
 */
export async function fetchAvaliacoesDoAluno(cpf: string): Promise<AvaliacoesDoAluno | null> {
    const res = await fetch(`${FIREBASE_DB_URL}/avaliacoes/${cpf}.json`, {
        next: { revalidate: 60 },
    })

    if (!res.ok) {
        throw new Error(`Erro ao buscar avaliações do aluno "${cpf}": ${res.statusText}`)
    }

    const data = await res.json()
    return data ?? null
}

/**
 * Busca uma avaliação específica pelo CPF e período.
 */
export async function fetchAvaliacaoPorPeriodo(cpf: string, periodo: string): Promise<Avaliacao | null> {
    const res = await fetch(`${FIREBASE_DB_URL}/avaliacoes/${cpf}/${periodo}.json`, {
        next: { revalidate: 60 },
    })

    if (!res.ok) {
        throw new Error(`Erro ao buscar avaliação "${cpf}/${periodo}": ${res.statusText}`)
    }

    const data = await res.json()
    return data ?? null
}

// ----- Helpers para mapear os dados para a UI -----

/**
 * Calcula a média das notas de um array de atributos (arredondada).
 */
export function calcularMedia(atributos: AtributoNota[]): number {
    if (!atributos || atributos.length === 0) return 0
    const soma = atributos.reduce((acc, attr) => acc + attr.valor, 0)
    return Math.round(soma / atributos.length)
}

/**
 * Mapeia uma Avaliação para o formato de "attributes" usado pela UI.
 */
export function mapAvaliacaoParaAttributes(avaliacao: Avaliacao) {
    return [
        { title: "Técnica", stars: calcularMedia(avaliacao.tecnica), delay: "animation-delay-300" },
        { title: "Movimentos", stars: calcularMedia(avaliacao.movimentos), delay: "animation-delay-400" },
        { title: "Expressão", stars: calcularMedia(avaliacao.expressao), delay: "animation-delay-300" },
        { title: "Comportamento", stars: calcularMedia(avaliacao.comportamento), delay: "animation-delay-400" },
        { title: "Conexão", stars: calcularMedia(avaliacao.conexao), delay: "animation-delay-200" },
    ]
}

/**
 * Mapeia os sub-atributos de cada categoria para o formato do modal.
 */
export function mapSubAttributes(avaliacao: Avaliacao): Record<string, { name: string; rating: number }[]> {
    const mapAtributos = (atributos: AtributoNota[]) =>
        atributos.map((a) => ({ name: a.nome, rating: a.valor }))

    return {
        "Técnica": mapAtributos(avaliacao.tecnica),
        "Movimentos": mapAtributos(avaliacao.movimentos),
        "Expressão": mapAtributos(avaliacao.expressao),
        "Comportamento": mapAtributos(avaliacao.comportamento),
        "Conexão": mapAtributos(avaliacao.conexao),
    }
}

/**
 * Extrai os textos de "Pontos Fortes" e "Pontos a Desenvolver".
 */
export function mapEvolucao(avaliacao: Avaliacao) {
    const pontosFortes = avaliacao.evolucao?.find((e) => e.nome === "Pontos fortes observados")?.valor ?? ""
    const pontosDesenvolver = avaliacao.evolucao?.find((e) => e.nome === "Pontos a desenvolver")?.valor ?? ""
    return { pontosFortes, pontosDesenvolver }
}
