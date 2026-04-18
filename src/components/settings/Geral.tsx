import { 
  Clock, 
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function Geral () {
            return (
          <div className="divide-y divide-border">
            <div className="pb-6">
              <h3 className="text-sm font-semibold text-foreground mb-1">Informacoes do sistema</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Configuracoes basicas do sistema de reservas
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Nome da instituicao
                  </label>
                  <Input defaultValue="Universidade Federal" className="max-w-md" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Fuso horario
                  </label>
                  <Select defaultValue="america-sao_paulo">
                    <SelectTrigger className="max-w-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="america-sao_paulo">America/Sao_Paulo (GMT-3)</SelectItem>
                      <SelectItem value="america-fortaleza">America/Fortaleza (GMT-3)</SelectItem>
                      <SelectItem value="america-manaus">America/Manaus (GMT-4)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Idioma padrao
                  </label>
                  <Select defaultValue="pt-BR">
                    <SelectTrigger className="max-w-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Portugues (Brasil)</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="es">Espanol</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="py-6">
              <h3 className="text-sm font-semibold text-foreground mb-1">Periodo letivo</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Configure o periodo academico atual
              </p>

              <div className="space-y-0 rounded-md border border-border overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-background">
                  <div className="flex items-center gap-3">
                    <Calendar className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Ano letivo atual</p>
                      <p className="text-xs text-muted-foreground">2026</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">Alterar</Button>
                </div>
                <div className="flex items-center justify-between px-4 py-3 bg-background border-t border-border">
                  <div className="flex items-center gap-3">
                    <Clock className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Semestre atual</p>
                      <p className="text-xs text-muted-foreground">1o Semestre (Fev - Jun)</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Em andamento</Badge>
                </div>
              </div>
            </div>
          </div>
        )
 
}