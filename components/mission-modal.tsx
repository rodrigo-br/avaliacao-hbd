"use client"

import { useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { X, Swords, CheckCircle2, ScrollText, Lock } from "lucide-react"

interface Sugestoes {
    observacoes: string
    selecionadas: string[]
}

interface MissionModalProps {
    open: boolean
    onClose: () => void
    sugestoes: Sugestoes
    locked?: boolean
}

export function MissionModal({ open, onClose, sugestoes, locked = false }: MissionModalProps) {
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        },
        [onClose]
    )

    useEffect(() => {
        if (open) {
            document.addEventListener("keydown", handleKeyDown)
            document.body.style.overflow = "hidden"
        }
        return () => {
            document.removeEventListener("keydown", handleKeyDown)
            document.body.style.overflow = ""
        }
    }, [open, handleKeyDown])

    if (!open) return null

    return createPortal(
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
        >
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className={`relative z-10 max-w-md w-[90%] bg-white rounded-3xl p-6 shadow-2xl transform transition-all duration-300 ease-out ${open ? "scale-100 opacity-100" : "scale-95 opacity-0"
                    }`}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200 group"
                    aria-label="Fechar modal"
                >
                    <X className="w-4 h-4 text-gray-500 group-hover:text-gray-700 transition-colors" />
                </button>

                {/* Header */}
                <div className="flex items-center justify-center gap-2 mb-5">
                    <Swords className="w-5 h-5 text-orange-500" />
                    <h2 className="text-lg font-bold text-gray-800 tracking-wide">
                        Minha Próxima Missão
                    </h2>
                    {locked && <Lock className="w-4 h-4 text-gray-400" />}
                </div>

                {/* Content */}
                <div className="relative">
                    <div className={`${locked ? "select-none" : ""}`}>
                        {/* Sugestões selecionadas */}
                        {sugestoes.selecionadas && sugestoes.selecionadas.length > 0 && (
                            <div className="mb-4">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 text-center">
                                    Missões Ativas
                                </p>
                                <div className="space-y-2">
                                    {sugestoes.selecionadas.map((item, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl px-4 py-3 border border-orange-100/60"
                                        >
                                            <CheckCircle2 className="w-5 h-5 text-orange-500 flex-shrink-0" />
                                            <span className="text-sm font-medium text-gray-700">
                                                {item}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Observações */}
                        {sugestoes.observacoes && (
                            <div className="bg-orange-50 rounded-2xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <ScrollText className="w-4 h-4 text-orange-400" />
                                    <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider">
                                        Observações
                                    </p>
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed pl-6">
                                    {sugestoes.observacoes}
                                </p>
                            </div>
                        )}

                        {/* Empty state */}
                        {(!sugestoes.selecionadas || sugestoes.selecionadas.length === 0) && !sugestoes.observacoes && (
                            <div className="bg-orange-50 rounded-2xl p-5 text-center">
                                <p className="text-sm text-gray-400 italic">
                                    Nenhuma missão registrada ainda.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Locked overlay on content */}
                    {locked && (
                        <div className="absolute inset-0 bg-white/30 backdrop-blur-[3px] rounded-2xl flex flex-col items-center justify-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                <Lock className="w-5 h-5 text-gray-400" />
                            </div>
                            <p className="text-sm font-bold text-black uppercase tracking-wider text-center px-4">
                                Contate a secretaria da escola para desbloquear
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    )
}

