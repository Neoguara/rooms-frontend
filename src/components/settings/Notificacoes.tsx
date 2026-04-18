import { 
  Mail,
  Smartphone,
  Globe,
} from "lucide-react"
import { Switch } from "@/components/ui/switch"

export function Notificaoes () {
    return (
          <div className="divide-y divide-border">
            <div className="pb-6">
              <h3 className="text-sm font-semibold text-foreground mb-1">Canais de notificacao</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Escolha como deseja receber notificacoes
              </p>

              <div className="space-y-0 rounded-md border border-border overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-background">
                  <div className="flex items-center gap-3">
                    <Mail className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Email</p>
                      <p className="text-xs text-muted-foreground">Receber notificacoes por email</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between px-4 py-3 bg-background border-t border-border">
                  <div className="flex items-center gap-3">
                    <Smartphone className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Push</p>
                      <p className="text-xs text-muted-foreground">Notificacoes no navegador</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between px-4 py-3 bg-background border-t border-border">
                  <div className="flex items-center gap-3">
                    <Globe className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">In-app</p>
                      <p className="text-xs text-muted-foreground">Notificacoes dentro do sistema</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>

            <div className="py-6">
              <h3 className="text-sm font-semibold text-foreground mb-1">Tipos de notificacao</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Selecione quais eventos geram notificacoes
              </p>

              <div className="space-y-0 rounded-md border border-border overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-background">
                  <span className="text-sm text-foreground">Nova solicitacao de reserva</span>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between px-4 py-3 bg-background border-t border-border">
                  <span className="text-sm text-foreground">Reserva aprovada/rejeitada</span>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between px-4 py-3 bg-background border-t border-border">
                  <span className="text-sm text-foreground">Lembrete de reserva (1h antes)</span>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between px-4 py-3 bg-background border-t border-border">
                  <span className="text-sm text-foreground">Conflito de horario</span>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>
          </div>
        ) 
}