export default function Home() {
  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-8">
      <div className="fixed inset-0 bg-background" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,106,0,0.12)_0%,_rgba(255,106,0,0.04)_35%,_transparent_70%)]" />
      <div className="relative z-10 text-center space-y-3 max-w-md">
        <p className="text-4xl">⚔️</p>
        <h1 className="text-xl font-bold text-foreground">
          Donzelord
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Para visualizar sua avaliação, acesse o link enviado pelo seu mestre com o código da avaliação.
        </p>
        <p className="text-xs text-muted-foreground/60 mt-4">
          Exemplo: <code className="bg-secondary px-2 py-1 rounded text-xs">/seu-codigo-aqui</code>
        </p>
      </div>
    </main>
  )
}
