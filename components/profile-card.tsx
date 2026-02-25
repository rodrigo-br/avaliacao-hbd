"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { ref, getDownloadURL } from "firebase/storage"
import { getFirebaseStorage } from "@/lib/firebase-app"
import { User } from "lucide-react"

interface ProfileCardProps {
  nomeAluno: string
  nivel: string
  cpf: string
}

export function ProfileCard({ nomeAluno, nivel, cpf }: ProfileCardProps) {
  const [fotoUrl, setFotoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    async function carregarFoto() {
      if (!cpf) return
      setLoading(true)

      const extensions = ["jpg", "jpeg", "png", "webp"]
      const storage = getFirebaseStorage()

      for (const ext of extensions) {
        try {
          const fotoRef = ref(storage, `fotos/${cpf}.${ext}`)
          const url = await getDownloadURL(fotoRef)
          setFotoUrl(url)
          return // URL encontrada, o Image component cuidará do restante do loading
        } catch (error) {
          continue
        }
      }
      setLoading(false) // Nenhuma imagem encontrada
    }

    carregarFoto()
  }, [cpf])

  const levelConfigs: Record<string, { glow: string; gradient: string; text: string }> = {
    "Branco": {
      glow: "255, 255, 255",
      gradient: "from-white to-gray-200",
      text: "text-white",
    },
    "Verde": {
      glow: "34, 197, 94",
      gradient: "from-green-500 to-emerald-400",
      text: "text-green-500",
    },
    "Laranja": {
      glow: "255, 106, 0",
      gradient: "from-primary to-orange-400",
      text: "text-orange-500",
    },
    "Lilás": {
      glow: "168, 85, 247",
      gradient: "from-purple-500 to-indigo-400",
      text: "text-purple-500",
    },
  }

  const config = levelConfigs[nivel] || levelConfigs["Laranja"]

  return (
    <div
      className="relative flex flex-col items-center -mt-8 animate-fade-in animation-delay-200"
      style={{ "--glow-color": config.glow } as React.CSSProperties}
    >
      <div className="relative">
        <div className={`w-24 h-24 rounded-full p-1 bg-gradient-to-br ${config.gradient} animate-border-glow`}>
          <div className={`w-full h-full rounded-full overflow-hidden border-2 border-background bg-secondary/50 relative flex items-center justify-center ${loading ? "animate-shimmer" : ""}`}>

            {fotoUrl && !imgError ? (
              <Image
                src={fotoUrl}
                alt="Foto do aluno"
                width={96}
                height={96}
                className={`w-full h-full object-cover transition-opacity duration-700 ${loading ? "opacity-0" : "opacity-100"}`}
                unoptimized={fotoUrl.startsWith("http")}
                onLoadingComplete={() => setLoading(false)}
                onError={() => {
                  setImgError(true)
                  setLoading(false)
                }}
              />
            ) : !loading && (
              <div className="animate-fade-in flex items-center justify-center w-full h-full">
                <User className="w-10 h-10 text-white/20" />
              </div>
            )}
          </div>
        </div>
        <div className="absolute -inset-2 rounded-full opacity-20 blur-xl -z-10 animate-glow-pulse" style={{ backgroundColor: `rgb(${config.glow})` }} />
      </div>

      <div className="mt-1 text-center">
        <p className="text-[10px] font-bold tracking-wider text-white">
          {nomeAluno}
        </p>
        <p className="text-[10px] font-bold tracking-wider text-white/80">
          Rank: {nivel}
        </p>
      </div>
    </div>
  )
}
