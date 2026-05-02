"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, ChevronDown, Users, Plus, Clock, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { type Room, type Booking, rooms, buildings, formatDate } from "@/lib/booking-data"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface RoomSchedulerProps {
  bookings: Booking[]
  onCellClick?: (roomId: string, date: Date) => void
  onBookingClick?: (booking: Booking) => void
  selectedRooms?: string[]
  startDate?: Date
  daysToShow?: number
}

// Gera array de datas a partir de uma data inicial
function generateDates(startDate: Date, days: number): Date[] {
  const dates: Date[] = []
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    dates.push(date)
  }
  return dates
}

// Formata data para comparação
function toDateString(date: Date): string {
  return date.toISOString().split("T")[0]
}

// Verifica se é fim de semana
function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6
}

// Verifica se é hoje
function isToday(date: Date): boolean {
  const today = new Date()
  return toDateString(date) === toDateString(today)
}

// Agrupa reservas por sala e data
function groupBookings(bookings: Booking[]): Map<string, Booking[]> {
  const map = new Map<string, Booking[]>()
  bookings.forEach((booking) => {
    const key = `${booking.roomId}-${booking.date}`
    const existing = map.get(key) || []
    map.set(key, [...existing, booking])
  })
  return map
}

// Componente de célula de reserva
function BookingCell({
  bookings,
  room,
  date,
  onCellClick,
  onBookingClick,
}: {
  bookings: Booking[]
  room: Room
  date: Date
  onCellClick?: (roomId: string, date: Date) => void
  onBookingClick?: (booking: Booking) => void
}) {
  const dateStr = toDateString(date)
  const dayBookings = bookings.filter(
    (b) => b.roomId === room.id && b.date === dateStr && b.status !== "cancelada" && b.status !== "rejeitada"
  )

  const weekend = isWeekend(date)
  const today = isToday(date)

  if (dayBookings.length === 0) {
    return (
      <td
        className={cn(
          "h-16 min-w-[100px] border-r border-b border-border/50 p-1 transition-colors",
          weekend && "bg-muted/30",
          today && "bg-primary/5",
          !weekend && "hover:bg-accent/50 cursor-pointer"
        )}
        onClick={() => !weekend && onCellClick?.(room.id, date)}
      >
        {!weekend && (
          <div className="flex h-full items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <Plus className="size-4 text-muted-foreground" />
          </div>
        )}
      </td>
    )
  }

  // Múltiplas reservas no mesmo dia
  if (dayBookings.length > 1) {
    return (
      <td
        className={cn(
          "h-16 min-w-[100px] border-r border-b border-border/50 p-1",
          today && "bg-primary/5"
        )}
      >
        <Popover>
          <PopoverTrigger asChild>
            <button className="w-full h-full rounded-md px-2 py-1 text-left bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 hover:border-primary/50 transition-colors">
              <div className="text-xs font-medium text-foreground truncate">
                {dayBookings.length} reservas
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <Users className="size-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">
                  {dayBookings.reduce((acc, b) => acc + (b.participants || 0), 0)}
                </span>
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-2" align="start">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-foreground">
                  Reservas em {formatDate(date)}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => onCellClick?.(room.id, date)}
                >
                  <Plus className="size-3 mr-1" />
                  Adicionar
                </Button>
              </div>
              <div className="space-y-1">
                {dayBookings.map((booking) => (
                  <button
                    key={booking.id}
                    className="w-full text-left p-2 rounded-md hover:bg-accent transition-colors border border-transparent hover:border-border"
                    onClick={() => onBookingClick?.(booking)}
                  >
                    <div
                      className="text-xs font-medium truncate"
                      style={{ color: booking.color }}
                    >
                      {booking.title}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {booking.startTime} - {booking.endTime} | {booking.userName}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </td>
    )
  }

  // Uma única reserva
  const booking = dayBookings[0]
  const isPending = booking.status === "pendente"

  return (
    <td
      className={cn(
        "h-16 min-w-[100px] border-r border-b border-border/50 p-1 group/cell",
        today && "bg-primary/5"
      )}
    >
      <Popover>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "w-full h-full rounded-md px-2 py-1 text-left transition-all relative",
              "border hover:shadow-md",
              isPending
                ? "bg-amber-500/10 border-amber-500/30 border-dashed"
                : "border-transparent"
            )}
            style={{
              backgroundColor: isPending ? undefined : `${booking.color}15`,
              borderColor: isPending ? undefined : `${booking.color}40`,
            }}
          >
            <div
              className="text-xs font-medium truncate"
              style={{ color: isPending ? "rgb(245 158 11)" : booking.color }}
            >
              {booking.title}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex items-center gap-1">
                <Clock className="size-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">
                  {booking.startTime}
                </span>
              </div>
              {booking.participants && (
                <div className="flex items-center gap-1">
                  <Users className="size-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">
                    {booking.participants}
                  </span>
                </div>
              )}
            </div>
            {/* Indicator de hover para adicionar */}
            <div className="absolute top-0.5 right-0.5 opacity-0 group-hover/cell:opacity-100 transition-opacity">
              <div className="size-4 rounded-full bg-primary/20 flex items-center justify-center">
                <Plus className="size-2.5 text-primary" />
              </div>
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-2" align="start">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-foreground">
                {formatDate(date)}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => onCellClick?.(room.id, date)}
              >
                <Plus className="size-3 mr-1" />
                Adicionar
              </Button>
            </div>
            <div className="border-t pt-2">
              <button
                className="w-full text-left p-2 rounded-md hover:bg-accent transition-colors"
                onClick={() => onBookingClick?.(booking)}
              >
                <div
                  className="text-xs font-medium truncate"
                  style={{ color: isPending ? "rgb(245 158 11)" : booking.color }}
                >
                  {booking.title}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {booking.startTime} - {booking.endTime}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  {booking.userName}
                </div>
                {isPending && (
                  <Badge variant="outline" className="text-amber-600 border-amber-500/50 mt-1 text-[10px]">
                    Aguardando aprovação
                  </Badge>
                )}
              </button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </td>
  )
}

export function RoomScheduler({
  bookings,
  onCellClick,
  onBookingClick,
  selectedRooms,
  startDate,
  daysToShow = 14,
}: RoomSchedulerProps) {
  const [mounted, setMounted] = React.useState(false)
  const [collapsedBuildings, setCollapsedBuildings] = React.useState<Set<string>>(new Set())
  const [currentStartDate, setCurrentStartDate] = React.useState<Date>(() => {
    if (startDate) return startDate
    const today = new Date()
    // Começa na segunda-feira da semana atual
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(today.setDate(diff))
  })

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const dates = React.useMemo(
    () => generateDates(currentStartDate, daysToShow),
    [currentStartDate, daysToShow]
  )

  const filteredRooms = selectedRooms
    ? rooms.filter((r) => selectedRooms.includes(r.id))
    : rooms

  // Agrupa salas por prédio
  const roomsByBuilding = React.useMemo(() => {
    const grouped: Record<string, Room[]> = {}
    filteredRooms.forEach((room) => {
      if (!grouped[room.building]) {
        grouped[room.building] = []
      }
      grouped[room.building].push(room)
    })
    return grouped
  }, [filteredRooms])

  const toggleBuilding = (building: string) => {
    setCollapsedBuildings((prev) => {
      const next = new Set(prev)
      if (next.has(building)) {
        next.delete(building)
      } else {
        next.add(building)
      }
      return next
    })
  }

  const expandAll = () => setCollapsedBuildings(new Set())
  const collapseAll = () => setCollapsedBuildings(new Set(Object.keys(roomsByBuilding)))

  const navigatePrev = () => {
    const newDate = new Date(currentStartDate)
    newDate.setDate(newDate.getDate() - 7)
    setCurrentStartDate(newDate)
  }

  const navigateNext = () => {
    const newDate = new Date(currentStartDate)
    newDate.setDate(newDate.getDate() + 7)
    setCurrentStartDate(newDate)
  }

  const goToToday = () => {
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1)
    setCurrentStartDate(new Date(today.setDate(diff)))
  }

  // Agrupa datas por mês para o header
  const monthGroups = React.useMemo(() => {
    const groups: { month: string; count: number }[] = []
    let currentMonth = ""
    let count = 0

    dates.forEach((date) => {
      const month = date.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      })
      if (month !== currentMonth) {
        if (currentMonth) {
          groups.push({ month: currentMonth, count })
        }
        currentMonth = month
        count = 1
      } else {
        count++
      }
    })
    if (currentMonth) {
      groups.push({ month: currentMonth, count })
    }
    return groups
  }, [dates])

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        Carregando grade de horários...
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={navigatePrev}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Hoje
          </Button>
          <Button variant="outline" size="sm" onClick={navigateNext}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <div className="text-sm font-medium text-foreground capitalize">
          {currentStartDate.toLocaleDateString("pt-BR", {
            month: "long",
            year: "numeric",
          })}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={expandAll}>
              Expandir
            </Button>
            <span className="text-muted-foreground">/</span>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={collapseAll}>
              Recolher
            </Button>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="size-3 rounded bg-emerald-500/20 border border-emerald-500/40" />
              <span>Aprovada</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="size-3 rounded bg-amber-500/20 border border-amber-500/40 border-dashed" />
              <span>Pendente</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scheduler Grid */}
      <ScrollArea className="flex-1">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-card">
            {/* Month row */}
            <tr>
              <th className="sticky left-0 z-20 bg-card min-w-[180px] border-r border-b border-border" />
              {monthGroups.map((group, idx) => (
                <th
                  key={`${group.month}-${idx}`}
                  colSpan={group.count}
                  className="px-2 py-2 text-xs font-medium text-muted-foreground text-center border-r border-b border-border capitalize"
                >
                  {group.month}
                </th>
              ))}
            </tr>
            {/* Days row */}
            <tr>
              <th className="sticky left-0 z-20 bg-card min-w-[180px] px-4 py-2 text-left border-r border-b border-border">
                <span className="text-sm font-medium text-foreground">Sala</span>
              </th>
              {dates.map((date) => {
                const weekend = isWeekend(date)
                const today = isToday(date)
                return (
                  <th
                    key={toDateString(date)}
                    className={cn(
                      "min-w-[100px] px-2 py-2 text-center border-r border-b border-border",
                      weekend && "bg-muted/30",
                      today && "bg-primary/10"
                    )}
                  >
                    <div className="text-[10px] uppercase text-muted-foreground">
                      {date.toLocaleDateString("pt-BR", { weekday: "short" })}
                    </div>
                    <div
                      className={cn(
                        "text-sm font-medium",
                        today ? "text-primary" : "text-foreground"
                      )}
                    >
                      {date.getDate()}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {filteredRooms.length === 0 ? (
              <tr>
                <td colSpan={dates.length + 1} className="text-center py-12 text-muted-foreground">
                  Nenhuma sala encontrada com os filtros aplicados.
                </td>
              </tr>
            ) : (
              Object.entries(roomsByBuilding).sort(([a], [b]) => a.localeCompare(b)).map(([building, buildingRooms]) => {
                const isCollapsed = collapsedBuildings.has(building)
                const buildingBookingsCount = bookings.filter(
                  (b) => buildingRooms.some((r) => r.id === b.roomId) && b.status !== "cancelada" && b.status !== "rejeitada"
                ).length

                return (
                  <React.Fragment key={building}>
                    {/* Building header row */}
                    <tr className="bg-muted/50">
                      <td
                        className="sticky left-0 z-10 bg-muted/50 min-w-[180px] px-4 py-2 border-r border-b border-border cursor-pointer hover:bg-muted transition-colors"
                        onClick={() => toggleBuilding(building)}
                      >
                        <div className="flex items-center gap-2">
                          <ChevronDown
                            className={cn(
                              "size-4 text-muted-foreground transition-transform",
                              isCollapsed && "-rotate-90"
                            )}
                          />
                          <Building2 className="size-4 text-primary" />
                          <span className="text-sm font-semibold text-foreground">{building}</span>
                          <Badge variant="secondary" className="ml-auto text-xs">
                            {buildingRooms.length} salas
                          </Badge>
                        </div>
                      </td>
                      {dates.map((date) => (
                        <td
                          key={toDateString(date)}
                          className={cn(
                            "min-w-[100px] border-r border-b border-border/50 bg-muted/50",
                            isWeekend(date) && "bg-muted/70",
                            isToday(date) && "bg-primary/10"
                          )}
                          onClick={() => toggleBuilding(building)}
                        />
                      ))}
                    </tr>
                    {/* Room rows */}
                    {!isCollapsed && buildingRooms.map((room) => (
                      <tr key={room.id} className="group">
                        {/* Room info cell */}
                        <td className="sticky left-0 z-10 bg-card min-w-[180px] px-4 py-2 border-r border-b border-border group-hover:bg-accent/30 transition-colors">
                          <div className="flex items-center gap-3 pl-4">
                            <div
                              className={cn(
                                "size-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
                                room.type === "laboratorio"
                                  ? "bg-blue-500/20 text-blue-600"
                                  : room.type === "auditorio"
                                  ? "bg-purple-500/20 text-purple-600"
                                  : room.type === "sala_reuniao"
                                  ? "bg-amber-500/20 text-amber-600"
                                  : "bg-emerald-500/20 text-emerald-600"
                              )}
                            >
                              {room.code.split("-").pop()}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-foreground truncate">
                                {room.name}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Users className="size-3 shrink-0" />
                                <span>{room.capacity}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        {/* Booking cells */}
                        {dates.map((date) => (
                          <BookingCell
                            key={`${room.id}-${toDateString(date)}`}
                            bookings={bookings}
                            room={room}
                            date={date}
                            onCellClick={onCellClick}
                            onBookingClick={onBookingClick}
                          />
                        ))}
                      </tr>
                    ))}
                  </React.Fragment>
                )
              })
            )}
          </tbody>
        </table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-card text-xs text-muted-foreground">
        <div>Total de salas: {filteredRooms.length}</div>
        <div>
          {bookings.filter((b) => b.status === "aprovada").length} reservas aprovadas |{" "}
          {bookings.filter((b) => b.status === "pendente").length} pendentes
        </div>
      </div>
    </div>
  )
}
