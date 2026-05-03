import { useTheme, type Theme } from '#/hooks/use-theme'
import { cn } from '#/lib/utils'
import { Check, Monitor, Moon, Sun } from 'lucide-react'

const themeOptions = [
  { value: "light", label: "Claro", icon: Sun, description: "Tema claro padrão" },
  { value: "dark", label: "Escuro", icon: Moon, description: "Tema escuro para ambientes com pouca luz" },
  { value: "system", label: "Sistema", icon: Monitor, description: "Seguir preferencia do sistema" },
]

export function Aparencia() {

  const { theme, setTheme } = useTheme();

  return (
    <div className="divide-y divide-border">
      {/* Theme Section */}
      <div className="pb-6">
        <h3 className="text-sm font-semibold text-foreground mb-1">
          Modo do tema
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Selecione como o tema deve ser exibido
        </p>
        <div className="flex flex-col gap-2">
          {themeOptions.map((option) => {
            const Icon = option.icon
              const isSelected = theme === option.value

            return (
              <button
                key={option.value}
                onClick={() => {
                  setTheme(option.value as Theme)
                }}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md border text-left transition-colors',
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-transparent hover:bg-muted/50',
                )}
              >
                <div
                  className={cn(
                    'flex items-center justify-center size-8 rounded-md',
                    isSelected
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-foreground">
                    {option.label}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {option.description}
                  </p>
                </div>
                {isSelected && <Check className="size-4 text-primary" />}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
