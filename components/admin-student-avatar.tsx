"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { User } from "lucide-react"

interface AdminStudentAvatarProps {
    cpf: string
    nome: string
}

export function AdminStudentAvatar({ cpf, nome }: AdminStudentAvatarProps) {
    const [fotoUrl, setFotoUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [imgError, setImgError] = useState(false)

    useEffect(() => {
        let mounted = true
        async function carregarFoto() {
            if (!cpf) {
                if (mounted) setLoading(false)
                return
            }
            setLoading(true)

            try {
                const res = await fetch(`/api/photo/${cpf}`)
                if (res.ok) {
                    const data = await res.json()
                    if (data.url && mounted) {
                        setFotoUrl(data.url)
                        return
                    }
                }
            } catch (error) {
                console.error("Erro ao carregar foto do admin:", error)
            }
            if (mounted) setLoading(false)
        }

        carregarFoto()

        return () => {
            mounted = false
        }
    }, [cpf])

    return (
        <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 bg-secondary/50 shrink-0 flex items-center justify-center">
            {fotoUrl && !imgError ? (
                <>
                    {loading && <div className="absolute inset-0 z-10 animate-pulse bg-primary/10" />}
                    <Image
                        src={fotoUrl}
                        alt={`Foto de ${nome}`}
                        fill
                        sizes="(max-width: 48px) 100vw, 48px"
                        className={`object-cover transition-opacity duration-300 ${loading ? "opacity-0" : "opacity-100"}`}
                        unoptimized={fotoUrl.startsWith("http")}
                        onLoadingComplete={() => setLoading(false)}
                        onError={() => setImgError(true)}
                    />
                </>
            ) : loading ? (
                <div className="w-full h-full animate-pulse bg-primary/10" />
            ) : (
                <User className="w-5 h-5 text-muted-foreground/50" />
            )}
        </div>
    )
}
