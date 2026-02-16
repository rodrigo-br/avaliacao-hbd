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

// ----- Funções de busca -----

/**
 * Busca todas as avaliações do Firebase.
 * Retorna um Record onde a chave é o ID do aluno e o valor é a Avaliação.
 */
export async function fetchAvaliacoes(): Promise<Record<string, Avaliacao>> {
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
 * Busca uma avaliação específica pelo ID (chave no Firebase).
 */
export async function fetchAvaliacao(id: string): Promise<Avaliacao | null> {
    const res = await fetch(`${FIREBASE_DB_URL}/avaliacoes/${id}.json`, {
        next: { revalidate: 60 },
    })

    if (!res.ok) {
        throw new Error(`Erro ao buscar avaliação "${id}": ${res.statusText}`)
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
