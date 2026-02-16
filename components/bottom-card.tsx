"use client"

import { ThumbsUp, Target } from "lucide-react"

interface BottomCardProps {
  pontosFortes: string
  pontosDesenvolver: string
}

export function BottomCard({ pontosFortes, pontosDesenvolver }: BottomCardProps) {
  return (
    <div className="animate-fade-in animation-delay-500 rounded-2xl bg-card/60 backdrop-blur-md border border-border/40 p-5 shadow-lg shadow-primary/5">
      {/* Pontos Fortes */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2">
          <ThumbsUp className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
            Pontos Fortes
          </h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed pl-6">
          {pontosFortes || "Nenhum ponto forte registrado."}
        </p>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent mb-5" />

      {/* Pontos a Desenvolver */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
            Pontos a Desenvolver
          </h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed pl-6">
          {pontosDesenvolver || "Nenhum ponto a desenvolver registrado."}
        </p>
      </div>
    </div>
  )
}
