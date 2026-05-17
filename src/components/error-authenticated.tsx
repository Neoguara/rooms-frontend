import { AlertTriangle, RefreshCw, ChevronLeft, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "@tanstack/react-router"

export function ErrorAuthenticated({
  reset,
}: {
  reset: () => void
}) {

  return (
    <div className="flex flex-1 flex-col items-center justify-center w-full h-full p-6">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="size-20 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="size-10 text-destructive" />
            </div>
            <div className="absolute -bottom-1 -right-1 size-7 rounded-full bg-background border-4 border-background">
              <div className="size-full rounded-full bg-destructive/20 flex items-center justify-center">
                <span className="text-xs font-bold text-destructive">!</span>
              </div>
            </div>
          </div>
        </div>

        <h1 className="text-xl font-bold text-foreground mb-2">
          Algo deu errado
        </h1>

        <p className="text-sm text-muted-foreground mb-6">
          Ocorreu um erro inesperado ao carregar esta página.
          Tente novamente ou volte para o início.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="gap-2"
          >
            <ChevronLeft className="size-4" />
            Voltar
          </Button>
          <Button onClick={reset} className="gap-2">
            <RefreshCw className="size-4" />
            Tentar novamente
          </Button>
        </div>

        <div className="mt-6 pt-6 border-t">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <LayoutDashboard className="size-4" />
            Ir para o dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
