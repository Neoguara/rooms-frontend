import { GraduationCap } from "lucide-react"

export function LoadingPublic() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background">
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
        <div className="relative flex items-center justify-center size-20 rounded-full bg-primary/10 border-2 border-primary/30">
          <GraduationCap className="size-10 text-primary animate-pulse" />
        </div>
      </div>

      <h1 className="text-2xl font-bold text-foreground mb-2">
        Rooms
      </h1>
      <p className="text-sm text-muted-foreground mb-8">
        Sistema de Reservas Academicas
      </p>

      <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full animate-loading-bar" />
      </div>

      <p className="mt-4 text-xs text-muted-foreground animate-pulse">
        Carregando...
      </p>

      <style>{`
        @keyframes loading-bar {
          0% {
            width: 0%;
            margin-left: 0%;
          }
          50% {
            width: 60%;
            margin-left: 20%;
          }
          100% {
            width: 0%;
            margin-left: 100%;
          }
        }
        .animate-loading-bar {
          animation: loading-bar 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
