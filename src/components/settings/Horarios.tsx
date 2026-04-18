import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
export function Horarios () {
            return (
          <div className="divide-y divide-border">
            <div className="pb-6">
              <h3 className="text-sm font-semibold text-foreground mb-1">Configuracao de horarios</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Defina os horarios disponiveis para reserva
              </p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Horario de inicio
                  </label>
                  <Select defaultValue="07:00">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["06:00", "07:00", "08:00"].map((time) => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Horario de termino
                  </label>
                  <Select defaultValue="22:00">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["20:00", "21:00", "22:00", "23:00"].map((time) => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Duracao minima (minutos)
                  </label>
                  <Select defaultValue="30">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["15", "30", "45", "60"].map((min) => (
                        <SelectItem key={min} value={min}>{min} min</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Intervalo entre slots
                  </label>
                  <Select defaultValue="30">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["15", "30", "60"].map((min) => (
                        <SelectItem key={min} value={min}>{min} min</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="py-6">
              <h3 className="text-sm font-semibold text-foreground mb-1">Dias de funcionamento</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Selecione os dias disponiveis para reserva
              </p>

              <div className="flex flex-wrap gap-2">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map((day, i) => (
                  <button
                    key={day}
                    className={cn(
                      "size-10 rounded-full text-sm font-medium transition-colors border",
                      i >= 1 && i <= 5
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:border-muted-foreground"
                    )}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )
}