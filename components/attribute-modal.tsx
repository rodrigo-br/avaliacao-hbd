"use client"

import { useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { Star, X } from "lucide-react"

interface SubAttribute {
    name: string
    rating: number
}

interface AttributeModalProps {
    open: boolean
    onClose: () => void
    title: string
    attributes: SubAttribute[]
}

export function AttributeModal({ open, onClose, title, attributes }: AttributeModalProps) {
    // Close on ESC key
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

                {/* Title */}
                <h2 className="text-lg font-bold text-gray-800 text-center mb-5 tracking-wide">
                    {title}
                </h2>

                {/* Content Card */}
                <div className="bg-orange-50 rounded-2xl p-4 space-y-0">
                    {attributes.map((attr, index) => (
                        <div
                            key={attr.name}
                            className={`flex items-center justify-between py-3 ${index < attributes.length - 1 ? "border-b border-gray-200/80" : ""
                                }`}
                        >
                            {/* Attribute Name */}
                            <span className="text-sm font-medium text-gray-700">
                                {attr.name}
                            </span>

                            {/* Stars */}
                            <div className="flex items-center gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                        key={i}
                                        className={`w-4 h-4 transition-colors duration-200 ${i < attr.rating
                                                ? "fill-orange-400 text-orange-400"
                                                : "fill-none text-gray-300"
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>,
        document.body
    )
}
