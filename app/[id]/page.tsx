import { ProfileSection } from "@/components/profile-section"
import { BottomCard } from "@/components/bottom-card"
import { ActionButtons } from "@/components/action-buttons"
import { LogoIcon } from "@/components/logo-icon"
import {
    fetchAvaliacao,
    mapAvaliacaoParaAttributes,
    mapSubAttributes,
    mapEvolucao,
} from "@/lib/firebase"

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function Page({ params }: PageProps) {
    const { id } = await params

    // Busca os dados do Firebase usando o ID da URL
    const avaliacao = await fetchAvaliacao(id)

    // Fallback caso não encontre dados
    if (!avaliacao) {
        return (
            <main className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-8">
                <div className="fixed inset-0 bg-background" />
                <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,106,0,0.12)_0%,_rgba(255,106,0,0.04)_35%,_transparent_70%)]" />
                <div className="relative z-10 text-center space-y-3">
                    <p className="text-4xl">🔍</p>
                    <p className="text-lg font-semibold text-foreground">
                        Avaliação não encontrada
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Nenhuma avaliação encontrada para o código <strong>&quot;{id}&quot;</strong>.
                    </p>
                </div>
            </main>
        )
    }

    // Mapeia os dados do Firebase para o formato da UI
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
                    {/* Top-right Logo */}
                    <div className="flex justify-end mb-2 animate-fade-in">
                        <LogoIcon />
                    </div>

                    {/* Profile Section with Radial Attributes */}
                    <section className="relative mb-8" aria-label="Perfil do aluno">
                        <ProfileSection
                            attributes={attributes}
                            subAttributesMap={subAttributesMap}
                            nomeAluno={avaliacao.dados.nomeAluno}
                            nivel={avaliacao.dados.nivel}
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
                        />
                    </section>
                </div>
            </div>
        </main>
    )
}
