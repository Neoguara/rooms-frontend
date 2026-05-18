"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { 
  Search, 
  Filter,
  DoorOpen,
  Users,
  MapPin,
  Building2,
  Monitor,
  Wind,
  Wifi,
  Projector,
  Mic,
  Tv,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Calendar,
  Clock,
  Check,
  X,
  Sliders,
  SlidersHorizontal,
  Sparkles,
  AlertCircle,
  ArrowRight,
} from "lucide-react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth-provider"
import { 
  rooms as initialRooms, 
  Room, 
  RoomType, 
  getRoomTypeName, 
  initialBookings,
  timeSlots,
  Booking 
} from "@/lib/booking-data"
import { format, parse, isWithinInterval, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"

// Recursos disponíveis para filtro
const allResources = [
  { id: "projetor", label: "Projetor", icon: Projector, keywords: ["projetor", "datashow"] },
  { id: "ar_condicionado", label: "Ar Condicionado", icon: Wind, keywords: ["ar condicionado", "ar-condicionado", "climatização"] },
  { id: "quadro_branco", label: "Quadro Branco", icon: Monitor, keywords: ["quadro branco", "lousa"] },
  { id: "computadores", label: "Computadores", icon: Monitor, keywords: ["computadores", "pcs", "desktop"] },
  { id: "sistema_som", label: "Sistema de Som", icon: Mic, keywords: ["sistema de som", "som", "audio", "caixa de som"] },
  { id: "microfones", label: "Microfones", icon: Mic, keywords: ["microfones", "microfone", "mic"] },
  { id: "tv", label: "TV", icon: Tv, keywords: ["tv", "televisão", "monitor"] },
  { id: "videoconferencia", label: "Videoconferência", icon: Monitor, keywords: ["videoconferência", "videoconferencia", "webconference"] },
  { id: "wifi", label: "Wi-Fi", icon: Wifi, keywords: ["wifi", "wi-fi", "internet"] },
]

const buildings = ["Bloco A", "Bloco B", "Bloco C", "Bloco D"]

const roomTypes: { value: RoomType; label: string }[] = [
  { value: "sala_aula", label: "Sala de Aula" },
  { value: "laboratorio", label: "Laboratório" },
  { value: "auditorio", label: "Auditório" },
  { value: "sala_reuniao", label: "Sala de Reunião" },
]

// Presets de busca rápida
const searchPresets = [
  { 
    label: "Aula com projetor", 
    icon: Projector,
    filters: { types: ["sala_aula"], resources: ["Projetor"], minCapacity: 30 }
  },
  { 
    label: "Laboratório de informática", 
    icon: Monitor,
    filters: { types: ["laboratorio"], resources: ["Computadores"], minCapacity: 20 }
  },
  { 
    label: "Apresentação/Palestra", 
    icon: Mic,
    filters: { types: ["auditorio"], resources: ["Sistema de Som", "Microfones", "Projetor"], minCapacity: 50 }
  },
  { 
    label: "Reunião pequena", 
    icon: Users,
    filters: { types: ["sala_reuniao"], resources: ["TV", "Videoconferência"], minCapacity: 0, maxCapacity: 20 }
  },
  { 
    label: "Videoconferência", 
    icon: Tv,
    filters: { types: [], resources: ["Videoconferência", "TV"], minCapacity: 0 }
  },
]

export default function BuscarSalaPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [rooms] = useState<Room[]>(initialRooms)
  const [bookings] = useState<Booking[]>(initialBookings)
  
  // Filtros básicos
  const [search, setSearch] = useState("")
  const [selectedTypes, setSelectedTypes] = useState<RoomType[]>([])
  const [selectedBuildings, setSelectedBuildings] = useState<string[]>([])
  const [selectedResources, setSelectedResources] = useState<string[]>([])
  
  // Filtros avançados
  const [minCapacity, setMinCapacity] = useState(0)
  const [maxCapacity, setMaxCapacity] = useState(300)
  const [onlyActive, setOnlyActive] = useState(true)
  const [checkAvailability, setCheckAvailability] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("all")
  
  // UI state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [activePreset, setActivePreset] = useState<string | null>(null)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Verificar disponibilidade de uma sala em uma data/horário
  const isRoomAvailable = (room: Room, date: Date, timeSlotId: string): boolean => {
    if (!date) return true
    
    const dateStr = format(date, "yyyy-MM-dd")
    const roomBookings = bookings.filter(
      b => b.roomId === room.id && 
      b.date === dateStr && 
      (b.status === "aprovada" || b.status === "pendente")
    )
    
    if (timeSlotId === "all") {
      return roomBookings.length === 0
    }
    
    const slot = timeSlots.find(s => s.id === timeSlotId)
    if (!slot) return true
    
    return !roomBookings.some(b => {
      const bookingStart = b.startTime
      const bookingEnd = b.endTime
      return !(slot.endTime <= bookingStart || slot.startTime >= bookingEnd)
    })
  }

  // Aplicar preset de busca
  const applyPreset = (preset: typeof searchPresets[0]) => {
    setSelectedTypes(preset.filters.types as RoomType[])
    setSelectedResources(preset.filters.resources)
    setMinCapacity(preset.filters.minCapacity)
    if (preset.filters.maxCapacity) {
      setMaxCapacity(preset.filters.maxCapacity)
    } else {
      setMaxCapacity(300)
    }
    setActivePreset(preset.label)
  }

  // Limpar todos os filtros
  const clearAllFilters = () => {
    setSearch("")
    setSelectedTypes([])
    setSelectedBuildings([])
    setSelectedResources([])
    setMinCapacity(0)
    setMaxCapacity(300)
    setOnlyActive(true)
    setCheckAvailability(false)
    setSelectedDate(undefined)
    setSelectedTimeSlot("all")
    setActivePreset(null)
  }

  // Filtrar salas
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      // Busca por texto
      const matchesSearch = search === "" || 
        room.name.toLowerCase().includes(search.toLowerCase()) ||
        room.code.toLowerCase().includes(search.toLowerCase()) ||
        room.building.toLowerCase().includes(search.toLowerCase())
      
      // Filtro por tipo
      const matchesType = selectedTypes.length === 0 || selectedTypes.includes(room.type)
      
      // Filtro por prédio
      const matchesBuilding = selectedBuildings.length === 0 || selectedBuildings.includes(room.building)
      
      // Filtro por recursos (todos os selecionados devem estar presentes)
      const matchesResources = selectedResources.length === 0 || 
        selectedResources.every(resource => 
          room.resources.some(r => r.toLowerCase().includes(resource.toLowerCase()))
        )
      
      // Filtro por capacidade
      const matchesCapacity = room.capacity >= minCapacity && room.capacity <= maxCapacity
      
      // Filtro por status
      const matchesStatus = !onlyActive || room.isActive
      
      // Filtro por disponibilidade
      const matchesAvailability = !checkAvailability || !selectedDate || 
        isRoomAvailable(room, selectedDate, selectedTimeSlot)
      
      return matchesSearch && matchesType && matchesBuilding && matchesResources && 
             matchesCapacity && matchesStatus && matchesAvailability
    })
  }, [rooms, search, selectedTypes, selectedBuildings, selectedResources, 
      minCapacity, maxCapacity, onlyActive, checkAvailability, selectedDate, selectedTimeSlot, bookings])

  // Contagem de filtros ativos
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (selectedTypes.length > 0) count++
    if (selectedBuildings.length > 0) count++
    if (selectedResources.length > 0) count++
    if (minCapacity > 0) count++
    if (maxCapacity < 300) count++
    if (checkAvailability && selectedDate) count++
    return count
  }, [selectedTypes, selectedBuildings, selectedResources, minCapacity, maxCapacity, checkAvailability, selectedDate])

  const getRoomTypeIcon = (type: RoomType) => {
    switch (type) {
      case "sala_aula": return DoorOpen
      case "laboratorio": return Monitor
      case "auditorio": return Mic
      case "sala_reuniao": return Users
      default: return DoorOpen
    }
  }

  const getRoomTypeColor = (type: RoomType) => {
    switch (type) {
      case "sala_aula": return "bg-emerald-500/20 text-emerald-600 border-emerald-500/30"
      case "laboratorio": return "bg-blue-500/20 text-blue-600 border-blue-500/30"
      case "auditorio": return "bg-amber-500/20 text-amber-600 border-amber-500/30"
      case "sala_reuniao": return "bg-purple-500/20 text-purple-600 border-purple-500/30"
      default: return "bg-gray-500/20 text-gray-600 border-gray-500/30"
    }
  }

  const handleReserveRoom = (room: Room) => {
    // Navegar para a página de grade com a sala pré-selecionada
    router.push(`/grade?sala=${room.id}`)
  }

  if (!mounted) return null

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex items-center gap-2">
              <Search className="size-5 text-primary" />
              <h1 className="text-lg font-semibold">Buscar Sala</h1>
            </div>
          </div>
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              <X className="mr-2 size-4" />
              Limpar filtros ({activeFiltersCount})
            </Button>
          )}
        </header>
        
        <div className="flex-1 overflow-auto p-6">
          {/* Presets de busca rápida */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <CardTitle className="text-base">Busca Rapida</CardTitle>
              </div>
              <CardDescription>Selecione um cenario comum para aplicar filtros automaticamente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {searchPresets.map((preset) => (
                  <Button
                    key={preset.label}
                    variant={activePreset === preset.label ? "default" : "outline"}
                    size="sm"
                    onClick={() => applyPreset(preset)}
                    className="gap-2"
                  >
                    <preset.icon className="size-4" />
                    {preset.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Filtros principais */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="space-y-4">
                {/* Barra de busca e filtros básicos */}
                <div className="flex flex-wrap items-center gap-4">
                  <div className="relative flex-1 min-w-[250px]">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome, codigo ou predio..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  
                  <Button 
                    variant={showAdvancedFilters ? "default" : "outline"}
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="gap-2"
                  >
                    <SlidersHorizontal className="size-4" />
                    Filtros Avancados
                    {activeFiltersCount > 0 && (
                      <Badge variant="secondary" className="ml-1 size-5 p-0 flex items-center justify-center text-xs">
                        {activeFiltersCount}
                      </Badge>
                    )}
                    {showAdvancedFilters ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  </Button>
                </div>

                {/* Filtros avançados */}
                <Collapsible open={showAdvancedFilters}>
                  <CollapsibleContent>
                    <div className="grid gap-6 pt-4 border-t border-border">
                      {/* Tipo de Ambiente */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <DoorOpen className="size-4" />
                          Tipo de Ambiente
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {roomTypes.map((type) => (
                            <Button
                              key={type.value}
                              variant={selectedTypes.includes(type.value) ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                if (selectedTypes.includes(type.value)) {
                                  setSelectedTypes(selectedTypes.filter(t => t !== type.value))
                                } else {
                                  setSelectedTypes([...selectedTypes, type.value])
                                }
                                setActivePreset(null)
                              }}
                            >
                              {selectedTypes.includes(type.value) && <Check className="mr-1 size-3" />}
                              {type.label}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Prédio */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Building2 className="size-4" />
                          Predio
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {buildings.map((building) => (
                            <Button
                              key={building}
                              variant={selectedBuildings.includes(building) ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                if (selectedBuildings.includes(building)) {
                                  setSelectedBuildings(selectedBuildings.filter(b => b !== building))
                                } else {
                                  setSelectedBuildings([...selectedBuildings, building])
                                }
                              }}
                            >
                              {selectedBuildings.includes(building) && <Check className="mr-1 size-3" />}
                              {building}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Recursos Necessários */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Sliders className="size-4" />
                          Recursos Necessarios
                        </Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                          {allResources.map((resource) => (
                            <div
                              key={resource.id}
                              className={cn(
                                "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors",
                                selectedResources.includes(resource.label)
                                  ? "bg-primary/10 border-primary text-primary"
                                  : "border-border hover:bg-accent"
                              )}
                              onClick={() => {
                                if (selectedResources.includes(resource.label)) {
                                  setSelectedResources(selectedResources.filter(r => r !== resource.label))
                                } else {
                                  setSelectedResources([...selectedResources, resource.label])
                                }
                                setActivePreset(null)
                              }}
                            >
                              <Checkbox
                                checked={selectedResources.includes(resource.label)}
                                className="pointer-events-none"
                              />
                              <resource.icon className="size-4" />
                              <span className="text-sm">{resource.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Capacidade */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Users className="size-4" />
                          Capacidade (lugares)
                        </Label>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Min:</span>
                            <Input
                              type="number"
                              value={minCapacity}
                              onChange={(e) => setMinCapacity(Number(e.target.value))}
                              className="w-20"
                              min={0}
                            />
                          </div>
                          <div className="flex-1 px-4">
                            <Slider
                              value={[minCapacity, maxCapacity]}
                              onValueChange={([min, max]) => {
                                setMinCapacity(min)
                                setMaxCapacity(max)
                                setActivePreset(null)
                              }}
                              min={0}
                              max={300}
                              step={5}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Max:</span>
                            <Input
                              type="number"
                              value={maxCapacity}
                              onChange={(e) => setMaxCapacity(Number(e.target.value))}
                              className="w-20"
                              max={300}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Verificar Disponibilidade */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="checkAvailability"
                            checked={checkAvailability}
                            onCheckedChange={(checked) => setCheckAvailability(checked as boolean)}
                          />
                          <Label 
                            htmlFor="checkAvailability" 
                            className="text-sm font-medium flex items-center gap-2 cursor-pointer"
                          >
                            <Calendar className="size-4" />
                            Verificar disponibilidade em data/horario especifico
                          </Label>
                        </div>
                        
                        {checkAvailability && (
                          <div className="flex flex-wrap items-center gap-4 pl-6">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" className="gap-2">
                                  <Calendar className="size-4" />
                                  {selectedDate 
                                    ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR })
                                    : "Selecionar data"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={selectedDate}
                                  onSelect={setSelectedDate}
                                  locale={ptBR}
                                />
                              </PopoverContent>
                            </Popover>
                            
                            <Select value={selectedTimeSlot} onValueChange={setSelectedTimeSlot}>
                              <SelectTrigger className="w-[200px]">
                                <Clock className="size-4 mr-2" />
                                <SelectValue placeholder="Horario" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Qualquer horario</SelectItem>
                                {timeSlots.map((slot) => (
                                  <SelectItem key={slot.id} value={slot.id}>
                                    {slot.startTime} - {slot.endTime}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>

                      {/* Mostrar apenas ativas */}
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="onlyActive"
                          checked={onlyActive}
                          onCheckedChange={(checked) => setOnlyActive(checked as boolean)}
                        />
                        <Label htmlFor="onlyActive" className="text-sm cursor-pointer">
                          Mostrar apenas salas ativas
                        </Label>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </CardContent>
          </Card>

          {/* Resumo dos filtros ativos */}
          {(selectedResources.length > 0 || selectedTypes.length > 0) && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-sm text-muted-foreground">Filtros ativos:</span>
              {selectedTypes.map(type => (
                <Badge key={type} variant="secondary" className="gap-1">
                  {getRoomTypeName(type)}
                  <X 
                    className="size-3 cursor-pointer" 
                    onClick={() => setSelectedTypes(selectedTypes.filter(t => t !== type))}
                  />
                </Badge>
              ))}
              {selectedResources.map(resource => (
                <Badge key={resource} variant="outline" className="gap-1">
                  {resource}
                  <X 
                    className="size-3 cursor-pointer" 
                    onClick={() => setSelectedResources(selectedResources.filter(r => r !== resource))}
                  />
                </Badge>
              ))}
            </div>
          )}

          {/* Resultados */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {filteredRooms.length} sala{filteredRooms.length !== 1 ? 's' : ''} encontrada{filteredRooms.length !== 1 ? 's' : ''}
            </h2>
          </div>

          {/* Lista de Salas */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredRooms.map((room) => {
              const TypeIcon = getRoomTypeIcon(room.type)
              const available = !checkAvailability || !selectedDate || 
                isRoomAvailable(room, selectedDate, selectedTimeSlot)
              
              return (
                <Card 
                  key={room.id} 
                  className={cn(
                    "group transition-all hover:shadow-md",
                    !room.isActive && "opacity-60",
                    checkAvailability && selectedDate && !available && "border-destructive/50 bg-destructive/5"
                  )}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "flex size-10 items-center justify-center rounded-lg",
                          getRoomTypeColor(room.type).split(" ")[0]
                        )}>
                          <TypeIcon className={cn("size-5", getRoomTypeColor(room.type).split(" ")[1])} />
                        </div>
                        <div>
                          <CardTitle className="text-base">{room.name}</CardTitle>
                          <CardDescription className="text-xs">{room.code}</CardDescription>
                        </div>
                      </div>
                      {checkAvailability && selectedDate && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant={available ? "default" : "destructive"} className="gap-1">
                                {available ? <Check className="size-3" /> : <X className="size-3" />}
                                {available ? "Disponivel" : "Ocupada"}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              {available 
                                ? "Sala disponivel para o horario selecionado"
                                : "Sala ja possui reserva no horario selecionado"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <Badge variant="outline" className={getRoomTypeColor(room.type)}>
                        {getRoomTypeName(room.type)}
                      </Badge>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="size-4" />
                        <span>{room.capacity} lugares</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="size-4" />
                      <span>{room.building} - {room.floor}° Andar</span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {room.resources.map((resource) => {
                        const isSelected = selectedResources.some(r => 
                          resource.toLowerCase().includes(r.toLowerCase())
                        )
                        return (
                          <Badge 
                            key={resource} 
                            variant={isSelected ? "default" : "secondary"} 
                            className="text-xs"
                          >
                            {isSelected && <Check className="mr-1 size-3" />}
                            {resource}
                          </Badge>
                        )
                      })}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setSelectedRoom(room)}
                      >
                        Ver Ficha
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1 gap-1"
                        onClick={() => handleReserveRoom(room)}
                        disabled={checkAvailability && selectedDate && !available}
                      >
                        Reservar
                        <ArrowRight className="size-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {filteredRooms.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="size-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhuma sala encontrada</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Tente ajustar os filtros para encontrar salas disponiveis.
              </p>
              <Button variant="outline" onClick={clearAllFilters}>
                Limpar filtros
              </Button>
            </div>
          )}
        </div>

        {/* Modal de Ficha da Sala */}
        <Dialog open={!!selectedRoom} onOpenChange={() => setSelectedRoom(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {selectedRoom && (() => {
                  const Icon = getRoomTypeIcon(selectedRoom.type)
                  return (
                    <>
                      <div className={cn(
                        "flex size-10 items-center justify-center rounded-lg",
                        getRoomTypeColor(selectedRoom.type).split(" ")[0]
                      )}>
                        <Icon className={cn("size-5", getRoomTypeColor(selectedRoom.type).split(" ")[1])} />
                      </div>
                      <div>
                        <span>{selectedRoom.name}</span>
                        <p className="text-sm font-normal text-muted-foreground">{selectedRoom.code}</p>
                      </div>
                    </>
                  )
                })()}
              </DialogTitle>
            </DialogHeader>
            {selectedRoom && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Tipo</p>
                    <Badge variant="outline" className={getRoomTypeColor(selectedRoom.type)}>
                      {getRoomTypeName(selectedRoom.type)}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={selectedRoom.isActive ? "default" : "secondary"}>
                      {selectedRoom.isActive ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Localizacao</p>
                    <p className="font-medium">{selectedRoom.building} - {selectedRoom.floor}° Andar</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Capacidade</p>
                    <p className="font-medium">{selectedRoom.capacity} lugares</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Recursos Disponiveis</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedRoom.resources.map((resource) => (
                      <Badge key={resource} variant="outline">
                        {resource}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedRoom(null)}>
                Fechar
              </Button>
              <Button onClick={() => {
                if (selectedRoom) {
                  handleReserveRoom(selectedRoom)
                }
              }}>
                Reservar esta Sala
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  )
}
