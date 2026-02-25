"use client"

import { useState } from "react"
import { MessageCircle, Swords, Lock } from "lucide-react"
import { FeedbackModal } from "@/components/feedback-modal"
import { MissionModal } from "@/components/mission-modal"

interface FeedbackItem {
  nome: string
  valor: string
}

interface Sugestoes {
  observacoes: string
  selecionadas: string[]
}

interface ActionButtonsProps {
  feedback: FeedbackItem[]
  sugestoes: Sugestoes
  professor?: string
  locked?: boolean
}

export function ActionButtons({ feedback, sugestoes, professor, locked = false }: ActionButtonsProps) {
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false)
  const [missionModalOpen, setMissionModalOpen] = useState(false)

  return (
    <>
      <div className="animate-fade-in animation-delay-700 flex flex-col gap-3 sm:flex-row">
        <button
          className="flex-1 flex items-center justify-center gap-2 rounded-full bg-secondary px-5 py-3 text-sm font-bold text-secondary-foreground uppercase tracking-wide border border-border/50 transition-all duration-300 hover:bg-secondary/80 hover:scale-105 hover:border-primary/30 active:scale-95"
          type="button"
          onClick={() => setFeedbackModalOpen(true)}
        >
          <MessageCircle className="w-4 h-4" />
          Ver Feedback do Mestre
          {locked && <Lock className="w-3.5 h-3.5 text-secondary-foreground/50" />}
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-orange-500 px-5 py-3 text-sm font-bold text-primary-foreground uppercase tracking-wide shadow-lg shadow-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/50 hover:scale-105 active:scale-95"
          type="button"
          onClick={() => setMissionModalOpen(true)}
        >
          <Swords className="w-4 h-4" />
          Minha Próxima Missão
          {locked && <Lock className="w-3.5 h-3.5 text-primary-foreground/50" />}
        </button>
      </div>

      {/* Modais */}
      <FeedbackModal
        open={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        feedbackList={feedback}
        professor={professor}
        locked={locked}
      />
      <MissionModal
        open={missionModalOpen}
        onClose={() => setMissionModalOpen(false)}
        sugestoes={sugestoes}
        locked={locked}
      />
    </>
  )
}

