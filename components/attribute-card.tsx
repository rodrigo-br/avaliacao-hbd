"use client"

import { Star, Lock } from "lucide-react"

interface AttributeCardProps {
  title: string
  stars: number
  delay?: string
  onClick?: () => void
  locked?: boolean
  emptyMode?: boolean
}

export function AttributeCard({ title, stars, delay = "", onClick, locked = false, emptyMode = false }: AttributeCardProps) {
  const containerClasses = emptyMode
    ? `animate-fade-in ${delay} rounded-xl p-2 border border-primary relative overflow-hidden bg-transparent`
    : `animate-fade-in ${delay} group cursor-pointer rounded-xl bg-gradient-to-br from-primary/90 to-orange-600/90 p-2 backdrop-blur-sm border border-primary/20 shadow-lg shadow-primary/10 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/20 relative overflow-hidden`

  const textClasses = emptyMode ? "text-primary" : "text-primary-foreground"
  const starFilledClasses = emptyMode ? "fill-primary text-primary" : "fill-primary-foreground text-primary-foreground"
  const starEmptyClasses = emptyMode ? "fill-none text-primary/40" : "fill-none text-primary-foreground/40"

  return (
    <div
      onClick={emptyMode ? undefined : onClick}
      className={containerClasses}
    >
      <div className="flex items-center justify-center gap-1 mb-1 px-1">
        {locked && !emptyMode && (
          <Lock className={`w-2.5 h-2.5 shrink-0 ${textClasses}/70`} />
        )}
        <h3 className={`text-[10px] font-bold tracking-wide uppercase text-center break-words hyphens-auto ${textClasses}`}>
          {title}
        </h3>
      </div>
      <div className="flex items-center justify-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-3 h-3 transition-colors duration-300 ${i < stars ? starFilledClasses : starEmptyClasses}`}
          />
        ))}
      </div>
    </div>
  )
}

