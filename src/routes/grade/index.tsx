import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"
import {
  Building2,
  Edit3,
  Save,
  X,
  History,
  RotateCcw,
  Trash2,
  AlertCircle,
  Send,
  Search,
  Layers,
  Plus,
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useAPI } from "@/hooks/useAPI"
import type { components } from "@/api/schema"
import { RoomScheduler, type DisplayEvent } from "@/components/grade/room-scheduler"

export const Route = createFileRoute("/grade/")({
  component: GradePage,
})

type RoomResponse = components["schemas"]["RoomResponse"]
type EventResponse = components["schemas"]["EventResponse"]

interface EditAction {
  id: string
  type: "add" | "edit" | "delete"
  event: DisplayEvent
  originalEvent?: EventResponse
  timestamp: string
  description: string
}

function formatDateTime(isoString: string) {
  return new Date(isoString).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function toLocalDatetimeValue(isoString?: string): string {
  if (!isoString) return ""
  return isoString.slice(0, 16)
}

function toISOString(localDatetime: string): string {
  if (!localDatetime) return ""
  return new Date(localDatetime).toISOString()
}

function getActionIcon(type: EditAction["type"]) {
  switch (type) {
    case "add": return <Plus className="size-4 text-green-500" />
    case "edit": return <Edit3 className="size-4 text-blue-500" />
    case "delete": return <Trash2 className="size-4 text-red-500" />
  }
}

let localIdCounter = 0
function generateLocalId() {
  return `local-${Date.now()}-${++localIdCounter}`
}

function GradePage() {
  const { api } = useAPI()

  const { data: rooms = [], isLoading: loadingRooms } = api.rooms.findAll1.useQuery()
  const { data: events = [], isLoading: loadingEvents, refetch: refetchEvents } = api.events.findAll2.useQuery()

  const requestCreationMutation = api.events.requestCreation.useMutation()
  const requestUpdateMutation = api.events.requestUpdate.useMutation()
  const requestDeletionMutation = api.events.requestDeletion.useMutation()

  const roomList: RoomResponse[] = Array.isArray(rooms) ? rooms : []
  const eventList: EventResponse[] = Array.isArray(events) ? events : []

  const [selectedRoomTypes, setSelectedRoomTypes] = React.useState<string[]>([])
  const [selectedBuildings, setSelectedBuildings] = React.useState<string[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")

  const allRoomTypes = React.useMemo(() => {
    const set = new Set(roomList.map((r) => r.type ?? "").filter(Boolean))
    return Array.from(set).sort()
  }, [roomList])

  const allBuildings = React.useMemo(() => {
    const set = new Set(roomList.map((r) => r.building ?? "").filter(Boolean))
    return Array.from(set).sort()
  }, [roomList])

  React.useEffect(() => {
    if (allRoomTypes.length > 0 && selectedRoomTypes.length === 0) {
      setSelectedRoomTypes(allRoomTypes)
    }
  }, [allRoomTypes])

  React.useEffect(() => {
    if (allBuildings.length > 0 && selectedBuildings.length === 0) {
      setSelectedBuildings(allBuildings)
    }
  }, [allBuildings])

  const filteredRooms = React.useMemo(() => {
    return roomList
      .filter((r) => selectedRoomTypes.length === 0 || selectedRoomTypes.includes(r.type ?? ""))
      .filter((r) => selectedBuildings.length === 0 || selectedBuildings.includes(r.building ?? ""))
      .filter((r) => {
        if (!searchQuery) return true
        const q = searchQuery.toLowerCase()
        return (
          r.name?.toLowerCase().includes(q) ||
          r.code?.toLowerCase().includes(q) ||
          r.building?.toLowerCase().includes(q)
        )
      })
  }, [roomList, selectedRoomTypes, selectedBuildings, searchQuery])

  const [isEditMode, setIsEditMode] = React.useState(false)
  const [editActions, setEditActions] = React.useState<EditAction[]>([])

  const displayEvents = React.useMemo<DisplayEvent[]>(() => {
    let result: DisplayEvent[] = [...eventList]
    for (const action of editActions) {
      if (action.type === "add") {
        result = [...result, action.event]
      } else if (action.type === "edit") {
        result = result.map((e) => (e.id === action.originalEvent?.id ? action.event : e))
      } else if (action.type === "delete") {
        result = result.filter((e) => e.id !== action.event.id)
      }
    }
    return result
  }, [eventList, editActions])

  const [newEventDialog, setNewEventDialog] = React.useState(false)
  const [editEventDialog, setEditEventDialog] = React.useState(false)
  const [deleteConfirmDialog, setDeleteConfirmDialog] = React.useState(false)
  const [submitDialog, setSubmitDialog] = React.useState(false)
  const [cancelEditDialog, setCancelEditDialog] = React.useState(false)
  const [historySheetOpen, setHistorySheetOpen] = React.useState(false)

  const [selectedEvent, setSelectedEvent] = React.useState<DisplayEvent | null>(null)
  const [submitMessage, setSubmitMessage] = React.useState("")

  const [newForm, setNewForm] = React.useState({ title: "", description: "", roomId: "", startAt: "", endAt: "" })
  const [editForm, setEditForm] = React.useState({ title: "", description: "", roomId: "", startAt: "", endAt: "" })

  const enterEditMode = () => {
    setIsEditMode(true)
    setEditActions([])
  }

  const exitEditMode = () => {
    if (editActions.length > 0) setCancelEditDialog(true)
    else setIsEditMode(false)
  }

  const confirmCancelEdit = () => {
    setEditActions([])
    setIsEditMode(false)
    setCancelEditDialog(false)
  }

  const handleCellClick = (roomId: string, date: Date) => {
    const dateStr = date.toISOString().split("T")[0]
    setNewForm({ title: "", description: "", roomId, startAt: `${dateStr}T08:00`, endAt: `${dateStr}T10:00` })
    setNewEventDialog(true)
  }

  const handleEventClick = (event: DisplayEvent) => {
    setSelectedEvent(event)
    if (isEditMode) {
      setEditForm({
        title: event.title ?? "",
        description: event.description ?? "",
        roomId: event.roomId ?? "",
        startAt: toLocalDatetimeValue(event.startAt),
        endAt: toLocalDatetimeValue(event.endAt),
      })
      setEditEventDialog(true)
    }
  }

  const handleAddEvent = () => {
    if (!newForm.title || !newForm.roomId || !newForm.startAt || !newForm.endAt) return
    const room = roomList.find((r) => r.id === newForm.roomId)
    const newEvent: DisplayEvent = {
      id: generateLocalId(),
      roomId: newForm.roomId,
      title: newForm.title,
      description: newForm.description || undefined,
      startAt: toISOString(newForm.startAt),
      endAt: toISOString(newForm.endAt),
      _localOnly: true,
    }
    const action: EditAction = {
      id: generateLocalId(),
      type: "add",
      event: newEvent,
      timestamp: new Date().toISOString(),
      description: `Adicionou: ${newForm.title} — ${room?.name ?? newForm.roomId}`,
    }
    setEditActions((prev) => [...prev, action])
    setNewEventDialog(false)
  }

  const handleEditEvent = () => {
    if (!selectedEvent || !editForm.title) return
    const updatedEvent: DisplayEvent = {
      ...selectedEvent,
      title: editForm.title,
      description: editForm.description || undefined,
      roomId: editForm.roomId,
      startAt: toISOString(editForm.startAt),
      endAt: toISOString(editForm.endAt),
    }
    const action: EditAction = {
      id: generateLocalId(),
      type: "edit",
      event: updatedEvent,
      originalEvent: selectedEvent,
      timestamp: new Date().toISOString(),
      description: `Editou: ${selectedEvent.title}`,
    }
    setEditActions((prev) => [...prev, action])
    setEditEventDialog(false)
  }

  const handleDeleteEvent = () => {
    if (!selectedEvent) return
    const action: EditAction = {
      id: generateLocalId(),
      type: "delete",
      event: selectedEvent,
      timestamp: new Date().toISOString(),
      description: `Removeu: ${selectedEvent.title}`,
    }
    setEditActions((prev) => [...prev, action])
    setDeleteConfirmDialog(false)
    setEditEventDialog(false)
  }

  const undoLastAction = () => setEditActions((prev) => prev.slice(0, -1))

  const submitChanges = async () => {
    if (editActions.length === 0) return
    for (const action of editActions) {
      if (action.type === "add") {
        await requestCreationMutation.mutateAsync({
          body: {
            title: action.event.title,
            description: action.event.description,
            startAt: action.event.startAt,
            endAt: action.event.endAt,
            roomId: action.event.roomId,
            justification: submitMessage || undefined,
            userId: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
          },
        })
      } else if (action.type === "edit" && action.originalEvent?.id && !action.originalEvent.id.startsWith("local-")) {
        await requestUpdateMutation.mutateAsync({
          body: {
            title: action.event.title,
            description: action.event.description,
            startAt: action.event.startAt,
            endAt: action.event.endAt,
            roomId: action.event.roomId,
            justification: submitMessage || undefined,
            userId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          },
          path: { id: action.originalEvent.id },
        })
      } else if (action.type === "delete" && action.event.id && !action.event.id.startsWith("local-")) {
        await requestDeletionMutation.mutateAsync({
          body: { justification: submitMessage || undefined, userId: "3fa85f64-5717-4562-b3fc-2c963f66afa6" },
          path: { id: action.event.id },
        })
      }
    }
    await refetchEvents()
    setEditActions([])
    setIsEditMode(false)
    setSubmitDialog(false)
    setSubmitMessage("")
  }

  const isSubmitting =
    requestCreationMutation.isPending ||
    requestUpdateMutation.isPending ||
    requestDeletionMutation.isPending

  const isLoading = loadingRooms || loadingEvents

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex items-center gap-2">
          <Building2 className="size-5 text-primary" />
          <h1 className="text-lg font-semibold text-foreground">Grade de Horários</h1>
        </div>

        {isEditMode && (
          <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary animate-pulse">
            <Edit3 className="size-3 mr-1" />
            Modo de Edição
          </Badge>
        )}

        <div className="ml-auto flex items-center gap-2">
          {isEditMode ? (
            <>
              <Badge variant="outline" className="text-xs">
                {editActions.length} alteração(ões)
              </Badge>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={undoLastAction} disabled={editActions.length === 0}>
                      <RotateCcw className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Desfazer última ação</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button variant="outline" size="sm" onClick={exitEditMode}>
                <X className="size-4 mr-2" />
                Cancelar
              </Button>

              <Button size="sm" onClick={() => setSubmitDialog(true)} disabled={editActions.length === 0}>
                <Send className="size-4 mr-2" />
                Enviar Alterações
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setHistorySheetOpen(true)}>
                <History className="size-4 mr-2" />
                Histórico
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Building2 className="size-4 mr-2" />
                    Prédio
                    {selectedBuildings.length < allBuildings.length && (
                      <Badge variant="secondary" className="ml-2">{selectedBuildings.length}</Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="flex justify-between">
                    Prédios
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-auto p-0 text-xs" onClick={() => setSelectedBuildings(allBuildings)}>Todos</Button>
                      <span className="text-muted-foreground">/</span>
                      <Button variant="ghost" size="sm" className="h-auto p-0 text-xs" onClick={() => setSelectedBuildings([])}>Nenhum</Button>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {allBuildings.map((building) => (
                    <DropdownMenuCheckboxItem
                      key={building}
                      checked={selectedBuildings.includes(building)}
                      onCheckedChange={() =>
                        setSelectedBuildings((prev) =>
                          prev.includes(building) ? prev.filter((b) => b !== building) : [...prev, building]
                        )
                      }
                    >
                      <span className="flex-1">{building}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({roomList.filter((r) => r.building === building).length})
                      </span>
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Layers className="size-4 mr-2" />
                    Tipo
                    {selectedRoomTypes.length < allRoomTypes.length && (
                      <Badge variant="secondary" className="ml-2">{selectedRoomTypes.length}</Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="flex justify-between">
                    Tipos de Sala
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-auto p-0 text-xs" onClick={() => setSelectedRoomTypes(allRoomTypes)}>Todos</Button>
                      <span className="text-muted-foreground">/</span>
                      <Button variant="ghost" size="sm" className="h-auto p-0 text-xs" onClick={() => setSelectedRoomTypes([])}>Nenhum</Button>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {allRoomTypes.map((type) => (
                    <DropdownMenuCheckboxItem
                      key={type}
                      checked={selectedRoomTypes.includes(type)}
                      onCheckedChange={() =>
                        setSelectedRoomTypes((prev) =>
                          prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
                        )
                      }
                    >
                      <span className="flex-1">{type}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({roomList.filter((r) => r.type === type).length})
                      </span>
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="default" size="sm" onClick={enterEditMode}>
                <Edit3 className="size-4 mr-2" />
                Editar Grade
              </Button>
            </>
          )}
        </div>
      </header>

      {isEditMode && (
        <div className="border-b bg-muted/30 px-4 py-2">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">
              Clique em uma célula vazia para adicionar ou em um evento para editar.
            </span>
            <div className="ml-auto flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Plus className="size-4 text-green-500" />
                <span>Adicionar</span>
              </div>
              <div className="flex items-center gap-2">
                <Edit3 className="size-4 text-blue-500" />
                <span>Editar</span>
              </div>
              <div className="flex items-center gap-2">
                <Trash2 className="size-4 text-red-500" />
                <span>Remover</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="border-b bg-background px-4 py-2">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar sala por nome ou código..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
            {searchQuery && (
              <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0" onClick={() => setSearchQuery("")}>
                <X className="size-4" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Exibindo</span>
            <Badge variant="secondary" className="font-mono">{filteredRooms.length}</Badge>
            <span>de</span>
            <Badge variant="outline" className="font-mono">{roomList.length}</Badge>
            <span>salas</span>
          </div>

          {(selectedBuildings.length < allBuildings.length || selectedRoomTypes.length < allRoomTypes.length || searchQuery) && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => {
                setSelectedBuildings(allBuildings)
                setSelectedRoomTypes(allRoomTypes)
                setSearchQuery("")
              }}
            >
              <X className="size-4 mr-1" />
              Limpar filtros
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Carregando...
          </div>
        ) : (
          <RoomScheduler
            events={displayEvents}
            rooms={filteredRooms}
            onCellClick={handleCellClick}
            onEventClick={handleEventClick}
            isEditMode={isEditMode}
            daysToShow={14}
          />
        )}
      </div>

      {isEditMode && editActions.length > 0 && (
        <div className="border-t bg-muted/30 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-sm">Alterações pendentes</h3>
            <Button variant="ghost" size="sm" onClick={() => setEditActions([])}>Limpar tudo</Button>
          </div>
          <ScrollArea className="max-h-32">
            <div className="space-y-1">
              {editActions.map((action) => (
                <div key={action.id} className="flex items-center gap-2 text-sm py-1 px-2 rounded bg-background">
                  {getActionIcon(action.type)}
                  <span className="flex-1">{action.description}</span>
                  <span className="text-xs text-muted-foreground">{formatDateTime(action.timestamp)}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Dialog: Novo evento */}
      <Dialog open={newEventDialog} onOpenChange={setNewEventDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Evento</DialogTitle>
            <DialogDescription>Preencha as informações para adicionar um evento à grade.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input value={newForm.title} onChange={(e) => setNewForm({ ...newForm, title: e.target.value })} placeholder="Ex: Engenharia de Software I" />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={newForm.description} onChange={(e) => setNewForm({ ...newForm, description: e.target.value })} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Sala *</Label>
              <Select value={newForm.roomId} onValueChange={(v) => setNewForm({ ...newForm, roomId: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione a sala..." /></SelectTrigger>
                <SelectContent>
                  {roomList.map((room) => (
                    <SelectItem key={room.id} value={room.id!}>
                      {room.name} — {room.building}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Início *</Label>
                <Input type="datetime-local" value={newForm.startAt} onChange={(e) => setNewForm({ ...newForm, startAt: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Fim *</Label>
                <Input type="datetime-local" value={newForm.endAt} onChange={(e) => setNewForm({ ...newForm, endAt: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewEventDialog(false)}>Cancelar</Button>
            <Button onClick={handleAddEvent} disabled={!newForm.title || !newForm.roomId || !newForm.startAt || !newForm.endAt}>
              <Plus className="size-4 mr-2" />
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar evento */}
      <Dialog open={editEventDialog} onOpenChange={setEditEventDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Evento</DialogTitle>
            <DialogDescription>Faça as alterações necessárias no evento selecionado.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Sala</Label>
              <Select value={editForm.roomId} onValueChange={(v) => setEditForm({ ...editForm, roomId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {roomList.map((room) => (
                    <SelectItem key={room.id} value={room.id!}>
                      {room.name} — {room.building}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Início</Label>
                <Input type="datetime-local" value={editForm.startAt} onChange={(e) => setEditForm({ ...editForm, startAt: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Fim</Label>
                <Input type="datetime-local" value={editForm.endAt} onChange={(e) => setEditForm({ ...editForm, endAt: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="destructive" size="sm" onClick={() => setDeleteConfirmDialog(true)}>
              <Trash2 className="size-4 mr-2" />
              Remover
            </Button>
            <div className="flex gap-2 sm:ml-auto">
              <Button variant="outline" onClick={() => setEditEventDialog(false)}>Cancelar</Button>
              <Button onClick={handleEditEvent} disabled={!editForm.title}>
                <Save className="size-4 mr-2" />
                Salvar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog: Confirmar remoção */}
      <AlertDialog open={deleteConfirmDialog} onOpenChange={setDeleteConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Evento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este evento? A ação pode ser desfeita enquanto o modo de edição estiver ativo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEvent} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog: Cancelar edição */}
      <AlertDialog open={cancelEditDialog} onOpenChange={setCancelEditDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Edições</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem {editActions.length} alteração(ões) não enviada(s). Deseja descartar todas as alterações?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancelEdit} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog: Enviar alterações */}
      <Dialog open={submitDialog} onOpenChange={setSubmitDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Enviar Alterações</DialogTitle>
            <DialogDescription>
              As alterações serão enviadas para a API.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Resumo das alterações</Label>
              <ScrollArea className="h-32 border rounded-md p-2">
                <div className="space-y-1">
                  {editActions.map((action) => (
                    <div key={action.id} className="flex items-center gap-2 text-sm">
                      {getActionIcon(action.type)}
                      <span>{action.description}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            <div className="space-y-2">
              <Label>Justificativa (opcional)</Label>
              <Textarea
                value={submitMessage}
                onChange={(e) => setSubmitMessage(e.target.value)}
                placeholder="Adicione uma justificativa ou observação..."
                rows={3}
              />
            </div>
            <div className="flex items-start gap-2 p-3 bg-blue-500/10 rounded-md text-blue-600 dark:text-blue-400">
              <AlertCircle className="size-5 mt-0.5 shrink-0" />
              <div className="text-sm">
                As alterações podem estar sujeitas a aprovação dependendo das permissões configuradas no sistema.
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitDialog(false)} disabled={isSubmitting}>Cancelar</Button>
            <Button onClick={submitChanges} disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : <><Send className="size-4 mr-2" />Enviar</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sheet: Histórico */}
      <Sheet open={historySheetOpen} onOpenChange={setHistorySheetOpen}>
        <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col">
          <SheetHeader className="px-6 py-5 border-b bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <History className="size-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-lg">Histórico de Edições</SheetTitle>
                <SheetDescription className="text-sm">Alterações realizadas na grade</SheetDescription>
              </div>
            </div>
          </SheetHeader>
          <ScrollArea className="flex-1">
            <div className="flex flex-col items-center justify-center py-16 text-center p-6">
              <div className="flex size-16 items-center justify-center rounded-full bg-muted mb-4">
                <History className="size-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Histórico não disponível</h3>
              <p className="text-sm text-muted-foreground max-w-60">
                O histórico de sessões de edição será exibido aqui quando disponível via API.
              </p>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  )
}
