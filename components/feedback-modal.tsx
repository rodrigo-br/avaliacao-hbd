"use client"

import { useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { X, MessageCircle, Quote, Lock } from "lucide-react"

interface FeedbackItem {
    nome: string
    valor: string
}

interface FeedbackModalProps {
    open: boolean
    onClose: () => void
    feedbackList: FeedbackItem[]
    professor?: string
    locked?: boolean
}

export function FeedbackModal({ open, onClose, feedbackList, professor, locked = false }: FeedbackModalProps) {
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
                    <MessageCircle className="w-5 h-5 text-orange-500" />
                    <h2 className="text-lg font-bold text-gray-800 tracking-wide">
                        Feedback do Mestre
                    </h2>
                    {locked && <Lock className="w-4 h-4 text-gray-400" />}
                </div>

                {/* Content */}
                <div className="relative">
                    <div className={`space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar ${locked ? "select-none" : ""}`}>
                        {feedbackList.map((item, index) => (
                            <div
                                key={index}
                                className="bg-orange-50/50 border border-orange-100/50 rounded-2xl p-5 relative group transition-colors hover:bg-orange-50"
                            >
                                {/* Decorative quote icon */}
                                <Quote className="absolute top-3 right-3 w-5 h-5 text-orange-200/50 group-hover:text-orange-200" />

                                {item.nome && item.nome !== "Feedback" && (
                                    <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-3">
                                        {item.nome}
                                    </p>
                                )}

                                <p className="text-sm text-gray-700 leading-relaxed italic mb-4">
                                    &ldquo;{item.valor}&rdquo;
                                </p>

                                {professor && (
                                    <div className="flex justify-end items-center gap-2 mt-4 pt-3 border-t border-orange-200/30">
                                        <div className="w-4 h-px bg-orange-300" />
                                        <p className="text-[11px] font-bold text-orange-600/80 uppercase tracking-widest">
                                            {professor}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}

                        {feedbackList.length === 0 && (
                            <div className="bg-orange-50 rounded-2xl p-5 text-center">
                                <p className="text-sm text-gray-400 italic">
                                    Nenhum feedback registrado ainda.
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

