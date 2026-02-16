"use client"

import Image from "next/image"

interface ProfileCardProps {
  nomeAluno: string
  nivel: string
}

export function ProfileCard({ nomeAluno, nivel }: ProfileCardProps) {
  return (
    <div className="relative flex flex-col items-center -mt-8 animate-fade-in animation-delay-200">
      {/* Profile Image with Glow Border */}
      <div className="relative">
        <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-br from-primary to-orange-400 animate-border-glow">
          <div className="w-full h-full rounded-full overflow-hidden border-2 border-background">
            <Image
              src="/images/profile.jpg"
              alt="Foto do aluno"
              width={96}
              height={96}
              className="w-full h-full object-cover"
              priority
            />
          </div>
        </div>
        {/* Outer glow ring */}
        <div className="absolute -inset-2 rounded-full bg-primary/10 blur-xl -z-10 animate-glow-pulse" />
      </div>

      {/* Rank Badge */}
      <div className="mt-1 text-center">
        <p className="text-[10px] font-bold tracking-wider text-orange-500">
          {nomeAluno}
        </p>
        <p className="text-[10px] font-bold tracking-wider text-orange-500">
          Rank: {nivel}
        </p>
      </div>
    </div>
  )
}
