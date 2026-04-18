import { cn } from "#/lib/utils"
import { Check } from "lucide-react"
import { Input } from "../ui/input"
import { Switch } from "@radix-ui/react-switch"

export function Aparencia ({ themeOptions, colorPresets }: {
    themeOptions: any
    colorPresets: any
}) {
        return (
          <div className="divide-y divide-border">
            {/* Theme Section */}
            <div className="pb-6">
              <h3 className="text-sm font-semibold text-foreground mb-1">Modo do tema</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Selecione como o tema deve ser exibido
              </p>
              <div className="flex flex-col gap-2">
                {themeOptions.map((option) => {
                  const Icon = option.icon
                //   const isSelected = theme === option.value
                  const isSelected = false

                  return (
                    <button
                      key={option.value}
                      onClick={() => {
                        // setTheme(option.value)
                        // setHasChanges(true)
                      }}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-md border text-left transition-colors",
                        isSelected 
                          ? "border-primary bg-primary/5" 
                          : "border-transparent hover:bg-muted/50"
                      )}
                    >
                      <div className={cn(
                        "flex items-center justify-center size-8 rounded-md",
                        isSelected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      )}>
                        <Icon className="size-4" />
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-medium text-foreground">{option.label}</span>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </div>
                      {isSelected && (
                        <Check className="size-4 text-primary" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Color Selection */}
            <div className="py-6">
              <h3 className="text-sm font-semibold text-foreground mb-1">Cores do tema</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Personalize as cores principais da interface
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Cor primaria
                  </label>
                  <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-border bg-background">
                    <input
                      type="color"
                    //   value={colors.primaryColor}
                    //   onChange={(e) => {
                    //     setColors({ primaryColor: e.target.value })
                    //     setHasChanges(true)
                    //   }}
                      className="size-5 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
                    />
                    <Input 
                    //   value={colors.primaryColor}
                    //   onChange={(e) => {
                    //     setColors({ primaryColor: e.target.value })
                    //     setHasChanges(true)
                    //   }}
                      className="border-0 h-auto p-0 text-sm bg-transparent focus-visible:ring-0 font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Cor de destaque
                  </label>
                  <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-border bg-background">
                    <input
                      type="color"
                    //   value={colors.accentColor}
                    //   onChange={(e) => {
                    //     setColors({ accentColor: e.target.value })
                    //     setHasChanges(true)
                    //   }}
                      className="size-5 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
                    />
                    <Input 
                    //   value={colors.accentColor}
                    //   onChange={(e) => {
                    //     setColors({ accentColor: e.target.value })
                    //     setHasChanges(true)
                    //   }}
                      className="border-0 h-auto p-0 text-sm bg-transparent focus-visible:ring-0 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Presets */}
              <div className="flex flex-wrap gap-2">
                {colorPresets.map((preset) => {
                //   const isActive = colors.primaryColor === preset.primary && colors.accentColor === preset.accent
                const isActive = false

                  return (
                    <button
                      key={preset.name}
                    //   onClick={() => applyPreset(preset)}
                      className={cn(
                        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                        isActive
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
                      )}
                    >
                      <div className="flex -space-x-1">
                        <div 
                          className="size-3.5 rounded-full border border-background/50" 
                          style={{ backgroundColor: preset.primary }}
                        />
                        <div 
                          className="size-3.5 rounded-full border border-background/50" 
                          style={{ backgroundColor: preset.accent }}
                        />
                      </div>
                      {preset.name}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )
}