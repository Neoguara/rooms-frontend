import { 
  Database,
  Webhook,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function Integracao () {
            return (
          <div className="divide-y divide-border">
            <div className="pb-6">
              <h3 className="text-sm font-semibold text-foreground mb-1">Integracoes disponiveis</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Conecte o sistema a outros servicos
              </p>

              <div className="space-y-0 rounded-md border border-border overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-background">
                  <div className="flex items-center gap-3">
                    <Calendar className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Google Calendar</p>
                      <p className="text-xs text-muted-foreground">Sincronizar reservas com Google Calendar</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-emerald-600 border-emerald-500/50">Conectado</Badge>
                </div>
                <div className="flex items-center justify-between px-4 py-3 bg-background border-t border-border">
                  <div className="flex items-center gap-3">
                    <Database className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Sistema Academico</p>
                      <p className="text-xs text-muted-foreground">Importar dados de professores e salas</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Conectar</Button>
                </div>
                <div className="flex items-center justify-between px-4 py-3 bg-background border-t border-border">
                  <div className="flex items-center gap-3">
                    <Webhook className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Webhooks</p>
                      <p className="text-xs text-muted-foreground">Enviar eventos para URLs externas</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Configurar</Button>
                </div>
              </div>
            </div>

            <div className="py-6">
              <h3 className="text-sm font-semibold text-foreground mb-1">API</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Gerencie chaves de acesso a API
              </p>

              <div className="p-4 rounded-md border border-border bg-muted/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-muted-foreground">Chave de API</span>
                  <Button variant="ghost" size="sm" className="h-6 text-xs">
                    Regenerar
                  </Button>
                </div>
                <code className="block text-xs font-mono bg-background p-2 rounded border border-border text-muted-foreground">
                  sk_live_***************************
                </code>
              </div>
            </div>
          </div>
        )
}