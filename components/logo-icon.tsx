"use client"

import Image from "next/image"

export function LogoIcon() {
  return (
    <div className="relative group cursor-pointer" aria-label="Hei Bora Dancar">
      <div className="relative w-20 h-20 transition-transform duration-300 group-hover:scale-110">
        <Image
          src="/images/logo.png"
          alt="Hei Bora Dançar Logo"
          fill
          className="object-contain drop-shadow-lg filter"
          sizes="88px"
          priority
        />
      </div>
      {/* Subtle glow behind */}
      <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  )
}
