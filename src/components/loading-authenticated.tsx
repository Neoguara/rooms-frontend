import { Loader2, Calendar, DoorOpen, Users, Clock } from "lucide-react"

interface LoadingAuthenticatedProps {
  message?: string
}

export function LoadingAuthenticated({ message = "Carregando" }: LoadingAuthenticatedProps) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background">
      <div className="relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative size-32">
            <div className="absolute inset-0 animate-spin-slow">
              <Calendar className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 size-5 text-primary/40" />
              <DoorOpen className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 size-5 text-primary/40" />
              <Users className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 size-5 text-primary/40" />
              <Clock className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 size-5 text-primary/40" />
            </div>
          </div>
        </div>
        <div className="relative flex items-center justify-center size-32">
          <div className="absolute inset-0 rounded-full border-2 border-muted" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
          <Loader2 className="size-8 text-primary animate-spin" />
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm font-medium text-foreground">
          {message}
        </p>
        <div className="flex items-center justify-center gap-1 mt-2">
          <span className="size-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="size-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="size-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>

      <style>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  )
}
