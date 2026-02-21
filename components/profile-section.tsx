"use client"

import { useEffect, useRef, useState } from "react"
import { AttributeCard } from "@/components/attribute-card"
import { ProfileCard } from "@/components/profile-card"
import { AttributeModal } from "@/components/attribute-modal"

interface Attribute {
    title: string
    stars: number
    delay: string
}

interface SubAttribute {
    name: string
    rating: number
}

interface ProfileSectionProps {
    attributes: Attribute[]
    subAttributesMap: Record<string, SubAttribute[]>
    nomeAluno: string
    nivel: string
    cpf: string
}

export function ProfileSection({ attributes, subAttributesMap, nomeAluno, nivel, cpf }: ProfileSectionProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const profileRef = useRef<HTMLDivElement>(null)
    const cardRefs = useRef<(HTMLDivElement | null)[]>([])

    const [lines, setLines] = useState<{ x1: number; y1: number; x2: number; y2: number }[]>([])

    // Modal state
    const [modalOpen, setModalOpen] = useState(false)
    const [modalTitle, setModalTitle] = useState("")
    const [modalAttributes, setModalAttributes] = useState<SubAttribute[]>([])

    const handleCardClick = (title: string) => {
        const subAttrs = subAttributesMap[title]
        if (subAttrs) {
            setModalTitle(title)
            setModalAttributes(subAttrs)
            setModalOpen(true)
        }
    }

    useEffect(() => {
        const updateLines = () => {
            if (!containerRef.current || !profileRef.current) return

            const containerRect = containerRef.current.getBoundingClientRect()
            const profileRect = profileRef.current.getBoundingClientRect()

            // Calculate profile center relative to the container
            const profileCenterX = profileRect.left + profileRect.width / 2 - containerRect.left
            const profileCenterY = profileRect.top + profileRect.height / 2 - containerRect.top

            // Calculate lines for each card
            const newLines = cardRefs.current.map((card) => {
                if (!card) return { x1: 0, y1: 0, x2: 0, y2: 0 }

                const cardRect = card.getBoundingClientRect()
                const cardCenterX = cardRect.left + cardRect.width / 2 - containerRect.left
                const cardCenterY = cardRect.top + cardRect.height / 2 - containerRect.top

                return {
                    x1: cardCenterX,
                    y1: cardCenterY,
                    x2: profileCenterX,
                    y2: profileCenterY,
                }
            })

            setLines(newLines)
        }

        // Initial update
        updateLines()

        // Update on resize
        window.addEventListener("resize", updateLines)

        // Update after a short delay to ensure animations/layout settle
        const timeout = setTimeout(updateLines, 100)
        const timeout2 = setTimeout(updateLines, 500)

        return () => {
            window.removeEventListener("resize", updateLines)
            clearTimeout(timeout)
            clearTimeout(timeout2)
        }
    }, [attributes])

    return (
        <>
            <div ref={containerRef} className="relative w-full">
                {/* Dynamic Connection Lines SVG */}
                <svg
                    className="absolute inset-0 w-full h-full z-0 pointer-events-none"
                    style={{ overflow: "visible" }}
                >
                    {lines.map((line, index) => (
                        <line
                            key={index}
                            x1={line.x1}
                            y1={line.y1}
                            x2={line.x2}
                            y2={line.y2}
                            stroke="rgba(255,106,0,0.2)"
                            strokeWidth="1"
                        />
                    ))}
                </svg>

                {/* Attribute Cards Grid - positioned radially */}
                <div className="relative z-10 flex flex-col items-center">

                    {/* Top center - (Index 4) */}
                    <div className="mb-8">
                        <div ref={(el: HTMLDivElement | null) => { cardRefs.current[4] = el }} className="w-[110px]">
                            <AttributeCard
                                title={attributes[4].title}
                                stars={attributes[4].stars}
                                delay={attributes[4].delay}
                                onClick={() => handleCardClick(attributes[4].title)}
                            />
                        </div>
                    </div>

                    {/* Mid row attributes */}
                    <div className="flex justify-between w-full px-1 mb-8">
                        {/* Left - (Index 0) */}
                        <div ref={(el: HTMLDivElement | null) => { cardRefs.current[0] = el }} className="w-[110px]">
                            <AttributeCard
                                title={attributes[0].title}
                                stars={attributes[0].stars}
                                delay={attributes[0].delay}
                                onClick={() => handleCardClick(attributes[0].title)}
                            />
                        </div>

                        {/* Right - (Index 1) */}
                        <div ref={(el: HTMLDivElement | null) => { cardRefs.current[1] = el }} className="w-[110px]">
                            <AttributeCard
                                title={attributes[1].title}
                                stars={attributes[1].stars}
                                delay={attributes[1].delay}
                                onClick={() => handleCardClick(attributes[1].title)}
                            />
                        </div>
                    </div>

                    {/* Profile Center */}
                    <div ref={profileRef} className="py-2 z-20">
                        <ProfileCard nomeAluno={nomeAluno} nivel={nivel} cpf={cpf} />
                    </div>

                    {/* Bottom row attributes */}
                    <div className="flex justify-between w-full px-1 mt-2">
                        {/* Left - (Index 2) */}
                        <div ref={(el: HTMLDivElement | null) => { cardRefs.current[2] = el }} className="w-[110px]">
                            <AttributeCard
                                title={attributes[2].title}
                                stars={attributes[2].stars}
                                delay={attributes[2].delay}
                                onClick={() => handleCardClick(attributes[2].title)}
                            />
                        </div>

                        {/* Right - (Index 3) */}
                        <div ref={(el: HTMLDivElement | null) => { cardRefs.current[3] = el }} className="w-[110px]">
                            <AttributeCard
                                title={attributes[3].title}
                                stars={attributes[3].stars}
                                delay={attributes[3].delay}
                                onClick={() => handleCardClick(attributes[3].title)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal - rendered via portal, outside the main hierarchy */}
            <AttributeModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title={modalTitle}
                attributes={modalAttributes}
            />
        </>
    )
}
