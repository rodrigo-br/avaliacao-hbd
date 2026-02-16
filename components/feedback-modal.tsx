"use client"

import { useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { X, MessageCircle, Quote } from "lucide-react"

interface FeedbackItem {
    nome: string
    valor: string
}

interface FeedbackModalProps {
    open: boolean
    onClose: () => void
    feedbackList: FeedbackItem[]
}

export function FeedbackModal({ open, onClose, feedbackList }: FeedbackModalProps) {
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
                </div>

                {/* Content */}
                <div className="space-y-4">
                    {feedbackList.map((item, index) => (
                        <div
                            key={index}
                            className="bg-orange-50 rounded-2xl p-5 relative"
                        >
                            {/* Decorative quote icon */}
                            <Quote className="absolute top-3 right-3 w-5 h-5 text-orange-200" />

                            {item.nome && item.nome !== "Feedback" && (
                                <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-2">
                                    {item.nome}
                                </p>
                            )}

                            <p className="text-sm text-gray-700 leading-relaxed italic">
                                &ldquo;{item.valor}&rdquo;
                            </p>
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
            </div>
        </div>,
        document.body
    )
}
