import { useEffect } from "react"
import { AlertTriangle, RefreshCw, Home, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ErrorPublic({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Icone de erro */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="size-24 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="size-12 text-destructive" />
            </div>
            <div className="absolute -bottom-1 -right-1 size-8 rounded-full bg-background border-4 border-background">
              <div className="size-full rounded-full bg-destructive/20 flex items-center justify-center">
                <span className="text-xs font-bold text-destructive">!</span>
              </div>
            </div>
          </div>
        </div>

        {/* Titulo */}
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Algo deu errado
        </h1>
        
        {/* Descricao */}
        <p className="text-muted-foreground mb-6">
          Ocorreu um erro inesperado ao carregar esta pagina. 
          Por favor, tente novamente ou volte para a pagina inicial.
        </p>

        {/* Codigo do erro */}
          <div className="mb-6 p-3 rounded-lg bg-muted/50 border">
            <p className="text-xs text-muted-foreground">
              Codigo do erro: <code className="font-mono text-foreground">codigo</code>
            </p>
          </div>

        {/* Botoes de acao */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="gap-2"
          >
            <ChevronLeft className="size-4" />
            Voltar
          </Button>
          <Button
            onClick={reset}
            className="gap-2"
          >
            <RefreshCw className="size-4" />
            Tentar novamente
          </Button>
        </div>

        {/* Link para home */}
        <div className="mt-6 pt-6 border-t">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Home className="size-4" />
            Ir para a pagina inicial
          </a>
        </div>

        {/* Informacoes de suporte */}
        <p className="mt-8 text-xs text-muted-foreground">
          Se o problema persistir, entre em contato com o suporte tecnico.
        </p>
      </div>
    </div>
  )
}
