import * as React from "react"
import { ChevronLeft, ChevronRight, ChevronDown, Users, Plus, Clock, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import type { components } from "@/api/schema"

type RoomDetailResponse = components["schemas"]["RoomDetailResponse"]
type EventResponse = components["schemas"]["EventResponse"]

export interface DisplayEvent extends EventResponse {
  _localOnly?: boolean
  _color?: string
}

interface RoomSchedulerProps {
  events: DisplayEvent[]
  rooms: RoomDetailResponse[]
  onCellClick?: (roomId: string, date: Date) => void
  onEventClick?: (event: DisplayEvent) => void
  isEditMode?: boolean
  daysToShow?: number
}

const EVENT_COLORS = [
  "#10b981", "#3b82f6", "#8b5cf6", "#f59e0b",
  "#ef4444", "#06b6d4", "#ec4899", "#84cc16",
]

function getEventColor(event: DisplayEvent): string {
  if (event._color) return event._color
  const id = event.id ?? event.title ?? ""
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0
  return EVENT_COLORS[Math.abs(hash) % EVENT_COLORS.length]
}

function getDateStr(isoString?: string): string {
  if (!isoString) return ""
  return isoString.split("T")[0]
}

function getTimeStr(isoString?: string): string {
  if (!isoString) return ""
  return isoString.split("T")[1]?.substring(0, 5) ?? ""
}

function generateDates(startDate: Date, days: number): Date[] {
  const dates: Date[] = []
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    dates.push(d)
  }
  return dates
}

function toDateString(date: Date): string {
  return date.toISOString().split("T")[0]
}

function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6
}

function isToday(date: Date): boolean {
  return toDateString(date) === toDateString(new Date())
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
}

function BookingCell({
  events,
  room,
  date,
  isEditMode,
  onCellClick,
  onEventClick,
}: {
  events: DisplayEvent[]
  room: RoomDetailResponse
  date: Date
  isEditMode?: boolean
  onCellClick?: (roomId: string, date: Date) => void
  onEventClick?: (event: DisplayEvent) => void
}) {
  const dateStr = toDateString(date)
  const dayEvents = events.filter(
    (e) => e.roomId === room.id && getDateStr(e.startAt) === dateStr
  )
  const weekend = isWeekend(date)
  const today = isToday(date)

  if (dayEvents.length === 0) {
    return (
      <td
        className={cn(
          "h-16 min-w-25 max-w-25 truncate border-r border-b border-border/50 p-1 transition-colors",
          weekend && "bg-muted/30",
          today && "bg-primary/5",
          isEditMode && !weekend && "hover:bg-accent/50 cursor-pointer"
        )}
        onClick={() => isEditMode && !weekend && onCellClick?.(room.id!, date)}
      >
        {isEditMode && !weekend && (
          <div className="flex h-full items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <Plus className="size-4 text-muted-foreground" />
          </div>
        )}
      </td>
    )
  }

  if (dayEvents.length > 1) {
    return (
      <td className={cn("min-w-25 max-w-25 border-r border-b border-border/50 p-1 align-top", today && "bg-primary/5")}>
        <div className="flex flex-col gap-0.5">
          {dayEvents.map((event) => {
            const color = getEventColor(event)
            const isLocalOnly = event._localOnly
            return (
              <button
                key={event.id}
                className={cn(
                  "w-full rounded px-1.5 py-0.5 text-left transition-all border hover:shadow-sm",
                  isLocalOnly ? "border-dashed border-amber-500/40" : "border-transparent"
                )}
                style={{
                  backgroundColor: `${color}15`,
                  borderColor: isLocalOnly ? undefined : `${color}40`,
                }}
                onClick={() => onEventClick?.(event)}
              >
                <div className="text-[10px] font-medium truncate leading-tight" style={{ color: isLocalOnly ? "rgb(245 158 11)" : color }}>
                  {event.title}
                </div>
                <div className="text-[9px] text-muted-foreground leading-tight">
                  {getTimeStr(event.startAt)} - {getTimeStr(event.endAt)}
                </div>
              </button>
            )
          })}
          {isEditMode && (
            <button
              className="w-full rounded py-0.5 hover:bg-accent transition-colors flex items-center justify-center"
              onClick={() => onCellClick?.(room.id!, date)}
            >
              <Plus className="size-3 text-muted-foreground" />
            </button>
          )}
        </div>
      </td>
    )
  }

  const event = dayEvents[0]
  const color = getEventColor(event)
  const isLocalOnly = event._localOnly

  return (
    <td className={cn("h-16 min-w-25 max-w-25 border-r border-b border-border/50 p-1 group/cell", today && "bg-primary/5")}>
      <Popover>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "w-full h-full rounded-md px-2 py-1 text-left transition-all relative border hover:shadow-md",
              isLocalOnly ? "border-dashed border-amber-500/40" : "border-transparent"
            )}
            style={{
              backgroundColor: `${color}15`,
              borderColor: isLocalOnly ? undefined : `${color}40`,
            }}
          >
            <div className="text-xs font-medium truncate" style={{ color: isLocalOnly ? "rgb(245 158 11)" : color }}>
              {event.title}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <Clock className="size-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">{getTimeStr(event.startAt)} - {getTimeStr(event.endAt)}</span>
            </div>
            {isEditMode && (
              <div className="absolute top-0.5 right-0.5 opacity-0 group-hover/cell:opacity-100 transition-opacity">
                <div className="size-4 rounded-full bg-primary/20 flex items-center justify-center">
                  <Plus className="size-2.5 text-primary" />
                </div>
              </div>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-2" align="start">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-foreground">{formatDate(date)}</div>
              {isEditMode && (
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onCellClick?.(room.id!, date)}>
                  <Plus className="size-3 mr-1" />
                  Adicionar
                </Button>
              )}
            </div>
            <div className="border-t pt-2">
              <button
                className="w-full text-left p-2 rounded-md hover:bg-accent transition-colors"
                onClick={() => onEventClick?.(event)}
              >
                <div className="text-xs font-medium truncate" style={{ color: isLocalOnly ? "rgb(245 158 11)" : color }}>
                  {event.title}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {getTimeStr(event.startAt)} - {getTimeStr(event.endAt)}
                </div>
                {isLocalOnly && (
                  <Badge variant="outline" className="text-amber-600 border-amber-500/50 mt-1 text-[10px]">
                    Pendente envio
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
  events,
  rooms,
  onCellClick,
  onEventClick,
  isEditMode,
  daysToShow = 14,
}: RoomSchedulerProps) {
  const [mounted, setMounted] = React.useState(false)
  const [collapsedBuildings, setCollapsedBuildings] = React.useState<Set<string>>(new Set())
  const [currentStartDate, setCurrentStartDate] = React.useState<Date>(() => {
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(today.setDate(diff))
  })

  React.useEffect(() => { setMounted(true) }, [])

  const dates = React.useMemo(() => generateDates(currentStartDate, daysToShow), [currentStartDate, daysToShow])

  const buildings = React.useMemo(() => {
    const set = new Set(rooms.map((r) => r.building?.name ?? r.buildingId ?? "").filter(Boolean))
    return Array.from(set).sort()
  }, [rooms])

  const roomsByBuilding = React.useMemo(() => {
    const grouped: Record<string, RoomDetailResponse[]> = {}
    rooms.forEach((room) => {
      const building = room.building?.name ?? room.buildingId ?? "Sem Prédio"
      if (!grouped[building]) grouped[building] = []
      grouped[building].push(room)
    })
    return grouped
  }, [rooms])

  const monthGroups = React.useMemo(() => {
    const groups: { month: string; count: number }[] = []
    let currentMonth = ""
    let count = 0
    dates.forEach((date) => {
      const month = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
      if (month !== currentMonth) {
        if (currentMonth) groups.push({ month: currentMonth, count })
        currentMonth = month
        count = 1
      } else {
        count++
      }
    })
    if (currentMonth) groups.push({ month: currentMonth, count })
    return groups
  }, [dates])

  const toggleBuilding = (building: string) => {
    setCollapsedBuildings((prev) => {
      const next = new Set(prev)
      if (next.has(building)) next.delete(building)
      else next.add(building)
      return next
    })
  }

  const navigatePrev = () => {
    const d = new Date(currentStartDate)
    d.setDate(d.getDate() - 7)
    setCurrentStartDate(d)
  }

  const navigateNext = () => {
    const d = new Date(currentStartDate)
    d.setDate(d.getDate() + 7)
    setCurrentStartDate(d)
  }

  const goToToday = () => {
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1)
    setCurrentStartDate(new Date(today.setDate(diff)))
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        Carregando grade de horários...
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
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
          {currentStartDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setCollapsedBuildings(new Set())}>
              Expandir
            </Button>
            <span className="text-muted-foreground">/</span>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setCollapsedBuildings(new Set(buildings))}>
              Recolher
            </Button>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="size-3 rounded bg-emerald-500/20 border border-emerald-500/40" />
              <span>Evento</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="size-3 rounded bg-amber-500/20 border border-amber-500/40 border-dashed" />
              <span>Pendente</span>
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-card">
            <tr>
              <th className="sticky left-0 z-20 bg-card min-w-45 border-r border-b border-border" />
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
            <tr>
              <th className="sticky left-0 z-20 bg-card min-w-45 px-4 py-2 text-left border-r border-b border-border">
                <span className="text-sm font-medium text-foreground">Sala</span>
              </th>
              {dates.map((date) => {
                const weekend = isWeekend(date)
                const today = isToday(date)
                return (
                  <th
                    key={toDateString(date)}
                    className={cn(
                      "min-w-25 px-2 py-2 text-center border-r border-b border-border",
                      weekend && "bg-muted/30",
                      today && "bg-primary/10"
                    )}
                  >
                    <div className="text-[10px] uppercase text-muted-foreground">
                      {date.toLocaleDateString("pt-BR", { weekday: "short" })}
                    </div>
                    <div className={cn("text-sm font-medium", today ? "text-primary" : "text-foreground")}>
                      {date.getDate()}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {rooms.length === 0 ? (
              <tr>
                <td colSpan={dates.length + 1} className="text-center py-12 text-muted-foreground">
                  Nenhuma sala encontrada com os filtros aplicados.
                </td>
              </tr>
            ) : (
              Object.entries(roomsByBuilding).sort(([a], [b]) => a.localeCompare(b)).map(([building, buildingRooms]) => {
                const isCollapsed = collapsedBuildings.has(building)
                return (
                  <React.Fragment key={building}>
                    <tr className="bg-muted/50">
                      <td
                        className="sticky left-0 z-10 bg-muted/50 min-w-45 px-4 py-2 border-r border-b border-border cursor-pointer hover:bg-muted transition-colors"
                        onClick={() => toggleBuilding(building)}
                      >
                        <div className="flex items-center gap-2">
                          <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", isCollapsed && "-rotate-90")} />
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
                            "min-w-25 border-r border-b border-border/50 bg-muted/50",
                            isWeekend(date) && "bg-muted/70",
                            isToday(date) && "bg-primary/10"
                          )}
                          onClick={() => toggleBuilding(building)}
                        />
                      ))}
                    </tr>
                    {!isCollapsed && buildingRooms.map((room) => (
                      <tr key={room.id} className="group">
                        <td className="sticky left-0 z-10 bg-card min-w-45 px-4 py-2 border-r border-b border-border group-hover:bg-accent/30 transition-colors">
                          <div className="flex items-center gap-3 pl-4">
                            <div className={cn(
                              "size-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
                              room.type === "LABORATORY" ? "bg-blue-500/20 text-blue-600" :
                              room.type === "AUDITORIUM" ? "bg-purple-500/20 text-purple-600" :
                              room.type === "MEETING_ROOM" ? "bg-amber-500/20 text-amber-600" :
                              "bg-emerald-500/20 text-emerald-600"
                            )}>
                              {room.code?.split("-").pop() ?? room.code?.slice(-3) ?? "?"}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-foreground truncate">{room.name}</div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Users className="size-3 shrink-0" />
                                <span>{room.capacity ?? "—"}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        {dates.map((date) => (
                          <BookingCell
                            key={`${room.id}-${toDateString(date)}`}
                            events={events}
                            room={room}
                            date={date}
                            isEditMode={isEditMode}
                            onCellClick={onCellClick}
                            onEventClick={onEventClick}
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

      <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-card text-xs text-muted-foreground">
        <div>Total de salas: {rooms.length}</div>
        <div>{events.length} evento(s) no período</div>
      </div>
    </div>
  )
}
