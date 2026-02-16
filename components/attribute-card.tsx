"use client"

import { Star } from "lucide-react"

interface AttributeCardProps {
  title: string
  stars: number
  delay?: string
  onClick?: () => void
}

export function AttributeCard({ title, stars, delay = "", onClick }: AttributeCardProps) {
  return (
    <div
      onClick={onClick}
      className={`animate-fade-in ${delay} group cursor-pointer rounded-xl bg-gradient-to-br from-primary/90 to-orange-600/90 p-2 backdrop-blur-sm border border-primary/20 shadow-lg shadow-primary/10 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/20`}
    >
      <h3 className="text-[10px] font-bold text-primary-foreground tracking-wide uppercase mb-1 text-center break-words hyphens-auto px-1">
        {title}
      </h3>
      <div className="flex items-center justify-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-3 h-3 transition-colors duration-300 ${i < stars
              ? "fill-primary-foreground text-primary-foreground"
              : "fill-none text-primary-foreground/40"
              }`}
          />
        ))}
      </div>
    </div>
  )
}
