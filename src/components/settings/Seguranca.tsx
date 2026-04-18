import { 
  Key,
  Users,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
export function Seguranca () {
            return (
          <div className="divide-y divide-border">
            <div className="pb-6">
              <h3 className="text-sm font-semibold text-foreground mb-1">Autenticacao</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Configure as opcoes de seguranca do sistema
              </p>

              <div className="space-y-0 rounded-md border border-border overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-background">
                  <div className="flex items-center gap-3">
                    <Key className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Autenticacao em duas etapas</p>
                      <p className="text-xs text-muted-foreground">Adicione uma camada extra de seguranca</p>
                    </div>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between px-4 py-3 bg-background border-t border-border">
                  <div className="flex items-center gap-3">
                    <Users className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Login com SSO</p>
                      <p className="text-xs text-muted-foreground">Permitir login via provedor institucional</p>
                    </div>
                  </div>
                  <Badge>Configurar</Badge>
                </div>
              </div>
            </div>

            <div className="py-6">
              <h3 className="text-sm font-semibold text-foreground mb-1">Sessoes</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Gerencie a duracao das sessoes de usuario
              </p>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Timeout de sessao
                </label>
                <Select defaultValue="8">
                  <SelectTrigger className="max-w-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hora</SelectItem>
                    <SelectItem value="4">4 horas</SelectItem>
                    <SelectItem value="8">8 horas</SelectItem>
                    <SelectItem value="24">24 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="py-6">
              <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
                Zona de perigo
                <AlertCircle className="size-4 text-red-500" />
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Acoes irreversiveis do sistema
              </p>

              <div className="p-4 rounded-md border border-red-500/30 bg-red-500/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Limpar todos os dados</p>
                    <p className="text-xs text-muted-foreground">Remove todas as reservas e configuracoes</p>
                  </div>
                  <Button variant="destructive" size="sm">
                    Excluir dados
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )
}