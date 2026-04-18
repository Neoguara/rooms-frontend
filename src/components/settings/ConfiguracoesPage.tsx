import { useEffect, useState } from "react"
import { 
  Sun, 
  Moon, 
  Monitor, 
  Settings, 
  Clock, 
  Bell, 
  Shield, 
  Palette, 
  Puzzle,
  RotateCcw,
  Save,
} from "lucide-react"
import {  SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Aparencia } from "./Aparencia"
import { Geral } from "./Geral"
import { Horarios } from "./Horarios"
import { Notificaoes } from "./Notificacoes"
import { Seguranca } from "./Seguranca"
import { Integracao } from "./Integracao"

const settingsCategories = [
  { id: "aparencia", label: "Aparencia", icon: Palette, description: "Tema, cores e layout" },
//  { id: "geral", label: "Geral", icon: Settings, description: "Configuracoes basicas" },
//  { id: "horarios", label: "Horarios", icon: Clock, description: "Slots e intervalos" },
//  { id: "notificacoes", label: "Notificacoes", icon: Bell, description: "Alertas e emails" },
//  { id: "seguranca", label: "Seguranca", icon: Shield, description: "Senhas e acessos" },
//  { id: "integracao", label: "Integracoes", icon: Puzzle, description: "APIs e webhooks" },
]

const themeOptions = [
  { value: "light", label: "Claro", icon: Sun, description: "Tema claro padrao" },
  { value: "dark", label: "Escuro", icon: Moon, description: "Tema escuro para ambientes com pouca luz" },
  { value: "system", label: "Sistema", icon: Monitor, description: "Seguir preferencia do sistema" },
]

const colorPresets = [
  { name: "Academico", primary: "#1e3a8a", accent: "#d97706" },
  { name: "Azul Profundo", primary: "#0f3460", accent: "#ea580c" },
  { name: "Verde Academico", primary: "#1a5f3d", accent: "#c29f4a" },
  { name: "Marinho & Ouro", primary: "#0a2463", accent: "#d4af37" },
  { name: "Púrpura Real", primary: "#4a148c", accent: "#ffc107" },
  { name: "Cinza & Âmbar", primary: "#37474f", accent: "#ff9800" },
]

export function ConfiguracoesPage() {
//   const { theme, setTheme } = useTheme()
//   const { colors, setColors, resetColors } = useColors()
  const [mounted, setMounted] = useState(false)
  const [activeCategory, setActiveCategory] = useState("aparencia")
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const applyPreset = (preset: typeof colorPresets[0]) => {
    // setColors({
    //   primaryColor: preset.primary,
    //   accentColor: preset.accent,
    // })
    // setHasChanges(true)
  }

  const resetToDefault = () => {
    // resetColors()
    // setTheme("system")
    // setHasChanges(false)
  }

  const handleSave = () => {
    setHasChanges(false)
  }

  if (!mounted) {
    return null
  }

  const renderContent = () => {
    switch (activeCategory) {
      case "aparencia":
        return <Aparencia themeOptions={themeOptions} colorPresets={colorPresets}/>    
      case "geral":
        //return <Geral />
      case "horarios":
        //return <Horarios />
      case "notificacoes":
        //return <Notificaoes />
      case "seguranca":
        //return <Seguranca />
      case "integracao":
        //return <Integracao />

      default:
        return null
    }
  }

  return (
    <>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <Settings className="size-5 text-primary" />
            <h1 className="text-lg font-semibold text-foreground">Configuracoes</h1>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="max-w-5xl p-6">
            <div className="flex gap-8">
              {/* Sidebar Navigation */}
              <nav className="w-56 shrink-0">
                <div className="sticky top-6 space-y-1">
                  {settingsCategories.map((category) => {
                    const Icon = category.icon
                    const isActive = activeCategory === category.id
                    return (
                      <button
                        key={category.id}
                        onClick={() => setActiveCategory(category.id)}
                        className={cn(
                          "flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm transition-colors text-left",
                          isActive 
                            ? "bg-muted font-medium text-foreground" 
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        )}
                      >
                        <Icon className="size-4" />
                        <span>{category.label}</span>
                      </button>
                    )
                  })}
                </div>
              </nav>

              {/* Main Content */}
              <div className="flex-1 min-w-0">
                <div className="rounded-md border border-border bg-card">
                  {/* Content Header */}
                  <div className="px-6 py-4 border-b border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-semibold text-foreground">
                          {settingsCategories.find(c => c.id === activeCategory)?.label}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {settingsCategories.find(c => c.id === activeCategory)?.description}
                        </p>
                      </div>
                      {hasChanges && (
                        <Badge variant="outline" className="border-amber-500/50 text-amber-600 bg-amber-500/10">
                          Alteracoes nao salvas
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="px-6 py-6">
                    {renderContent()}
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 border-t border-border bg-muted/30 flex items-center justify-between">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={resetToDefault}
                      className="text-muted-foreground"
                    >
                      <RotateCcw className="size-4 mr-2" />
                      Restaurar padrao
                    </Button>
                    <Button 
                      size="sm"
                      onClick={handleSave}
                      disabled={!hasChanges}
                    >
                      <Save className="size-4 mr-2" />
                      Salvar alteracoes
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        </>
  )
}
