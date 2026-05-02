"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Filter,
  Download,
  Plus,
  Building2,
  Edit3,
  Save,
  X,
  History,
  RotateCcw,
  ArrowLeftRight,
  Trash2,
  Check,
  Clock,
  User,
  AlertCircle,
  ChevronDown,
  Eye,
  Send,
  MessageSquare,
  Search,
  Layers,
} from "lucide-react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
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
import { cn } from "@/lib/utils"
import { RoomScheduler } from "@/components/room-scheduler"
import { NewBookingDialog } from "@/components/new-booking-dialog"
import { useAuth } from "@/components/auth-provider"
import {
  rooms,
  buildings,
  initialBookings,
  timeSlots,
  bookingColors,
  generateId,
  type Booking,
  type RoomType,
  getRoomTypeName,
} from "@/lib/booking-data"

// Tipos para o modo de edição
interface EditAction {
  id: string
  type: "add" | "edit" | "delete" | "swap"
  booking: Booking
  originalBooking?: Booking
  swapWithBooking?: Booking
  timestamp: string
  description: string
}

interface EditSession {
  id: string
  userId: string
  userName: string
  userRole: string
  startedAt: string
  endedAt?: string
  status: "em_andamento" | "pendente_aprovacao" | "aprovada" | "rejeitada" | "cancelada"
  actions: EditAction[]
  message?: string
  reviewedBy?: string
  reviewedAt?: string
  reviewMessage?: string
}

// Usuários mock para troca
const mockUsers = [
  { id: "1", name: "Prof. Carlos Silva", role: "professor" },
  { id: "2", name: "Maria Santos", role: "funcionario" },
  { id: "3", name: "Dr. João Oliveira", role: "coordenador" },
  { id: "4", name: "Admin Sistema", role: "admin" },
  { id: "5", name: "Prof. Ana Paula Santos", role: "professor" },
  { id: "6", name: "Prof. Ricardo Oliveira", role: "professor" },
]

// Histórico de sessões de edição (exemplo)
const initialEditHistory: EditSession[] = [
  {
    id: "sess-1",
    userId: "3",
    userName: "Dr. João Oliveira",
    userRole: "Coordenador",
    startedAt: "2026-03-01T10:00:00Z",
    endedAt: "2026-03-01T10:30:00Z",
    status: "aprovada",
    actions: [
      {
        id: "act-1",
        type: "add",
        booking: initialBookings[0],
        timestamp: "2026-03-01T10:05:00Z",
        description: "Adicionou reserva: Engenharia de Software I - Sala 101",
      },
      {
        id: "act-2",
        type: "add",
        booking: initialBookings[1],
        timestamp: "2026-03-01T10:10:00Z",
        description: "Adicionou reserva: Engenharia de Software I - Sala 101",
      },
    ],
    message: "Configuração inicial do semestre 2026.1",
  },
  {
    id: "sess-2",
    userId: "1",
    userName: "Prof. Carlos Silva",
    userRole: "Professor",
    startedAt: "2026-03-05T14:00:00Z",
    endedAt: "2026-03-05T14:15:00Z",
    status: "aprovada",
    actions: [
      {
        id: "act-3",
        type: "edit",
        booking: { ...initialBookings[4], description: "Atividade prática de Java - Atualizada" },
        originalBooking: initialBookings[4],
        timestamp: "2026-03-05T14:05:00Z",
        description: "Editou reserva: Laboratório de Programação",
      },
    ],
    message: "Atualização da descrição da aula",
    reviewedBy: "3",
    reviewedAt: "2026-03-05T15:00:00Z",
    reviewMessage: "Aprovado. Alteração válida.",
  },
  {
    id: "sess-3",
    userId: "1",
    userName: "Prof. Carlos Silva",
    userRole: "Professor",
    startedAt: "2026-03-08T09:00:00Z",
    status: "pendente_aprovacao",
    actions: [
      {
        id: "act-4",
        type: "swap",
        booking: initialBookings[0],
        swapWithBooking: initialBookings[3],
        timestamp: "2026-03-08T09:05:00Z",
        description: "Solicitou troca: Sala 101 com Maria Santos (Treinamento de Sistemas)",
      },
    ],
    message: "Preciso trocar a sala para ajustar meus horários",
  },
]

const roomTypes: RoomType[] = ["sala_aula", "laboratorio", "auditorio", "sala_reuniao"]

export default function GradePage() {
  const { user, isLoading, canApprove, canManageUsers } = useAuth()
  const router = useRouter()
  
  // Estados principais
  const [bookings, setBookings] = React.useState<Booking[]>(initialBookings)
  const [selectedRoomTypes, setSelectedRoomTypes] = React.useState<RoomType[]>(roomTypes)
  const [selectedBuildings, setSelectedBuildings] = React.useState<string[]>(buildings)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [newBookingOpen, setNewBookingOpen] = React.useState(false)
  const [preselectedRoom, setPreselectedRoom] = React.useState<string | undefined>()
  const [preselectedDate, setPreselectedDate] = React.useState<Date | undefined>()
  
  // Estados do modo de edição
  const [isEditMode, setIsEditMode] = React.useState(false)
  const [editActions, setEditActions] = React.useState<EditAction[]>([])
  const [editHistory, setEditHistory] = React.useState<EditSession[]>(initialEditHistory)
  const [historySheetOpen, setHistorySheetOpen] = React.useState(false)
  const [selectedSession, setSelectedSession] = React.useState<EditSession | null>(null)
  
  // Estados para dialogs
  const [editBookingDialog, setEditBookingDialog] = React.useState(false)
  const [swapDialog, setSwapDialog] = React.useState(false)
  const [deleteConfirmDialog, setDeleteConfirmDialog] = React.useState(false)
  const [submitDialog, setSubmitDialog] = React.useState(false)
  const [cancelEditDialog, setCancelEditDialog] = React.useState(false)
  const [selectedBooking, setSelectedBooking] = React.useState<Booking | null>(null)
  
  // Estados para formulários
  const [editTitle, setEditTitle] = React.useState("")
  const [editDescription, setEditDescription] = React.useState("")
  const [editRoom, setEditRoom] = React.useState("")
  const [editStartTime, setEditStartTime] = React.useState("")
  const [editEndTime, setEditEndTime] = React.useState("")
  const [swapUserId, setSwapUserId] = React.useState("")
  const [swapBookingId, setSwapBookingId] = React.useState("")
  const [submitMessage, setSubmitMessage] = React.useState("")

  const isAdmin = canApprove || canManageUsers

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  // Filtro de salas considerando tipo, prédio e busca
  const filteredRooms = React.useMemo(() => {
    return rooms
      .filter((room) => selectedRoomTypes.includes(room.type))
      .filter((room) => selectedBuildings.includes(room.building))
      .filter((room) => {
        if (!searchQuery) return true
        const query = searchQuery.toLowerCase()
        return (
          room.name.toLowerCase().includes(query) ||
          room.code.toLowerCase().includes(query) ||
          room.building.toLowerCase().includes(query)
        )
      })
      .map((room) => room.id)
  }, [selectedRoomTypes, selectedBuildings, searchQuery])

  // Contadores para os filtros
  const roomsCount = filteredRooms.length
  const totalRooms = rooms.length

  const toggleRoomType = (type: RoomType) => {
    setSelectedRoomTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    )
  }

  const toggleBuilding = (building: string) => {
    setSelectedBuildings((prev) =>
      prev.includes(building)
        ? prev.filter((b) => b !== building)
        : [...prev, building]
    )
  }

  const selectAllBuildings = () => setSelectedBuildings(buildings)
  const clearAllBuildings = () => setSelectedBuildings([])
  const selectAllTypes = () => setSelectedRoomTypes(roomTypes)
  const clearAllTypes = () => setSelectedRoomTypes([])

  // Funções do modo de edição
  const enterEditMode = () => {
    setIsEditMode(true)
    setEditActions([])
  }

  const exitEditMode = () => {
    if (editActions.length > 0) {
      setCancelEditDialog(true)
    } else {
      setIsEditMode(false)
    }
  }

  const confirmCancelEdit = () => {
    // Reverter todas as alterações
    setBookings(initialBookings)
    setEditActions([])
    setIsEditMode(false)
    setCancelEditDialog(false)
  }

  const handleCellClick = (roomId: string, date: Date) => {
    if (isEditMode) {
      setPreselectedRoom(roomId)
      setPreselectedDate(date)
      setNewBookingOpen(true)
    }
  }

  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking)
    if (isEditMode) {
      // Abrir opções de edição
      setEditTitle(booking.title)
      setEditDescription(booking.description || "")
      setEditRoom(booking.roomId)
      setEditStartTime(booking.startTime)
      setEditEndTime(booking.endTime)
      setEditBookingDialog(true)
    } else {
      // Navegar para detalhes
      router.push(`/reserva/${booking.id}`)
    }
  }

  const handleNewBooking = (booking: Booking) => {
    const newBooking = {
      ...booking,
      id: generateId(),
      color: bookingColors[bookings.length % bookingColors.length],
    }
    
    setBookings((prev) => [...prev, newBooking])
    
    if (isEditMode) {
      const action: EditAction = {
        id: generateId(),
        type: "add",
        booking: newBooking,
        timestamp: new Date().toISOString(),
        description: `Adicionou reserva: ${newBooking.title} - ${rooms.find(r => r.id === newBooking.roomId)?.name}`,
      }
      setEditActions((prev) => [...prev, action])
    }
  }

  const handleEditBooking = () => {
    if (!selectedBooking) return

    const updatedBooking: Booking = {
      ...selectedBooking,
      title: editTitle,
      description: editDescription,
      roomId: editRoom,
      startTime: editStartTime,
      endTime: editEndTime,
      updatedAt: new Date().toISOString(),
    }

    setBookings((prev) =>
      prev.map((b) => (b.id === selectedBooking.id ? updatedBooking : b))
    )

    const action: EditAction = {
      id: generateId(),
      type: "edit",
      booking: updatedBooking,
      originalBooking: selectedBooking,
      timestamp: new Date().toISOString(),
      description: `Editou reserva: ${selectedBooking.title}`,
    }
    setEditActions((prev) => [...prev, action])
    setEditBookingDialog(false)
  }

  const handleDeleteBooking = () => {
    if (!selectedBooking) return

    setBookings((prev) => prev.filter((b) => b.id !== selectedBooking.id))

    const action: EditAction = {
      id: generateId(),
      type: "delete",
      booking: selectedBooking,
      timestamp: new Date().toISOString(),
      description: `Removeu reserva: ${selectedBooking.title}`,
    }
    setEditActions((prev) => [...prev, action])
    setDeleteConfirmDialog(false)
    setEditBookingDialog(false)
  }

  const openSwapDialog = () => {
    setSwapUserId("")
    setSwapBookingId("")
    setSwapDialog(true)
    setEditBookingDialog(false)
  }

  const handleSwapBooking = () => {
    if (!selectedBooking || !swapBookingId) return

    const swapWithBooking = bookings.find((b) => b.id === swapBookingId)
    if (!swapWithBooking) return

    // Trocar as reservas
    const updatedBookings = bookings.map((b) => {
      if (b.id === selectedBooking.id) {
        return {
          ...b,
          roomId: swapWithBooking.roomId,
          date: swapWithBooking.date,
          startTime: swapWithBooking.startTime,
          endTime: swapWithBooking.endTime,
        }
      }
      if (b.id === swapWithBooking.id) {
        return {
          ...b,
          roomId: selectedBooking.roomId,
          date: selectedBooking.date,
          startTime: selectedBooking.startTime,
          endTime: selectedBooking.endTime,
        }
      }
      return b
    })

    setBookings(updatedBookings)

    const action: EditAction = {
      id: generateId(),
      type: "swap",
      booking: selectedBooking,
      swapWithBooking: swapWithBooking,
      timestamp: new Date().toISOString(),
      description: `Trocou: ${selectedBooking.title} com ${swapWithBooking.title}`,
    }
    setEditActions((prev) => [...prev, action])
    setSwapDialog(false)
  }

  const undoLastAction = () => {
    if (editActions.length === 0) return

    const lastAction = editActions[editActions.length - 1]

    // Reverter a ação
    if (lastAction.type === "add") {
      setBookings((prev) => prev.filter((b) => b.id !== lastAction.booking.id))
    } else if (lastAction.type === "edit" && lastAction.originalBooking) {
      setBookings((prev) =>
        prev.map((b) => (b.id === lastAction.booking.id ? lastAction.originalBooking! : b))
      )
    } else if (lastAction.type === "delete") {
      setBookings((prev) => [...prev, lastAction.booking])
    } else if (lastAction.type === "swap" && lastAction.swapWithBooking) {
      // Reverter a troca
      setBookings((prev) =>
        prev.map((b) => {
          if (b.id === lastAction.booking.id) {
            return lastAction.booking
          }
          if (b.id === lastAction.swapWithBooking!.id) {
            return lastAction.swapWithBooking!
          }
          return b
        })
      )
    }

    setEditActions((prev) => prev.slice(0, -1))
  }

  const submitChanges = () => {
    if (editActions.length === 0) return

    const session: EditSession = {
      id: generateId(),
      userId: user?.id || "",
      userName: user?.name || "",
      userRole: user?.role === "admin" ? "Administrador" : 
                user?.role === "coordenador" ? "Coordenador" :
                user?.role === "professor" ? "Professor" : "Funcionário",
      startedAt: editActions[0].timestamp,
      endedAt: new Date().toISOString(),
      status: isAdmin ? "aprovada" : "pendente_aprovacao",
      actions: editActions,
      message: submitMessage,
    }

    setEditHistory((prev) => [session, ...prev])
    setEditActions([])
    setIsEditMode(false)
    setSubmitDialog(false)
    setSubmitMessage("")
  }

  const availableSwapBookings = bookings.filter((b) => {
    if (!swapUserId) return false
    return b.userId === swapUserId && b.id !== selectedBooking?.id
  })

  const getStatusBadge = (status: EditSession["status"]) => {
    switch (status) {
      case "em_andamento":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500">Em andamento</Badge>
      case "pendente_aprovacao":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">Pendente</Badge>
      case "aprovada":
        return <Badge variant="outline" className="bg-green-500/10 text-green-500">Aprovada</Badge>
      case "rejeitada":
        return <Badge variant="outline" className="bg-red-500/10 text-red-500">Rejeitada</Badge>
      case "cancelada":
        return <Badge variant="outline" className="bg-gray-500/10 text-gray-500">Cancelada</Badge>
    }
  }

  const getActionIcon = (type: EditAction["type"]) => {
    switch (type) {
      case "add":
        return <Plus className="size-4 text-green-500" />
      case "edit":
        return <Edit3 className="size-4 text-blue-500" />
      case "delete":
        return <Trash2 className="size-4 text-red-500" />
      case "swap":
        return <ArrowLeftRight className="size-4 text-purple-500" />
    }
  }

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <Building2 className="size-5 text-primary" />
            <h1 className="text-lg font-semibold text-foreground">Grade de Horários</h1>
          </div>
          
          {/* Edit mode indicator */}
          {isEditMode && (
            <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary animate-pulse">
              <Edit3 className="size-3 mr-1" />
              Modo de Edição
            </Badge>
          )}

          <div className="ml-auto flex items-center gap-2">
            {/* Edit mode actions */}
            {isEditMode ? (
              <>
                <Badge variant="outline" className="text-xs">
                  {editActions.length} alteração(ões)
                </Badge>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={undoLastAction}
                        disabled={editActions.length === 0}
                      >
                        <RotateCcw className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Desfazer última ação</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={exitEditMode}
                >
                  <X className="size-4 mr-2" />
                  Cancelar
                </Button>

                <Button
                  size="sm"
                  onClick={() => setSubmitDialog(true)}
                  disabled={editActions.length === 0}
                >
                  <Send className="size-4 mr-2" />
                  {isAdmin ? "Salvar Alterações" : "Enviar para Aprovação"}
                </Button>
              </>
            ) : (
              <>
                {/* Normal mode actions */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setHistorySheetOpen(true)}
                >
                  <History className="size-4 mr-2" />
                  Histórico
                </Button>

                {/* Filtro por Prédio */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Building2 className="size-4 mr-2" />
                      Prédio
                      {selectedBuildings.length < buildings.length && (
                        <Badge variant="secondary" className="ml-2">
                          {selectedBuildings.length}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="flex justify-between">
                      Prédios
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-auto p-0 text-xs" onClick={selectAllBuildings}>
                          Todos
                        </Button>
                        <span className="text-muted-foreground">/</span>
                        <Button variant="ghost" size="sm" className="h-auto p-0 text-xs" onClick={clearAllBuildings}>
                          Nenhum
                        </Button>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {buildings.map((building) => {
                      const count = rooms.filter(r => r.building === building).length
                      return (
                        <DropdownMenuCheckboxItem
                          key={building}
                          checked={selectedBuildings.includes(building)}
                          onCheckedChange={() => toggleBuilding(building)}
                        >
                          <span className="flex-1">{building}</span>
                          <span className="text-xs text-muted-foreground ml-2">({count})</span>
                        </DropdownMenuCheckboxItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Filtro por Tipo */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Layers className="size-4 mr-2" />
                      Tipo
                      {selectedRoomTypes.length < roomTypes.length && (
                        <Badge variant="secondary" className="ml-2">
                          {selectedRoomTypes.length}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="flex justify-between">
                      Tipos de Sala
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-auto p-0 text-xs" onClick={selectAllTypes}>
                          Todos
                        </Button>
                        <span className="text-muted-foreground">/</span>
                        <Button variant="ghost" size="sm" className="h-auto p-0 text-xs" onClick={clearAllTypes}>
                          Nenhum
                        </Button>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {roomTypes.map((type) => {
                      const count = rooms.filter(r => r.type === type).length
                      return (
                        <DropdownMenuCheckboxItem
                          key={type}
                          checked={selectedRoomTypes.includes(type)}
                          onCheckedChange={() => toggleRoomType(type)}
                        >
                          <span className="flex-1">{getRoomTypeName(type)}</span>
                          <span className="text-xs text-muted-foreground ml-2">({count})</span>
                        </DropdownMenuCheckboxItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="outline" size="sm" onClick={() => router.push("/relatorios")}>
                  <Download className="size-4 mr-2" />
                  Relatórios
                </Button>

                <Button
                  variant="default"
                  size="sm"
                  onClick={enterEditMode}
                >
                  <Edit3 className="size-4 mr-2" />
                  Editar Grade
                </Button>
              </>
            )}
          </div>
        </header>

        {/* Edit mode toolbar */}
        {isEditMode && (
          <div className="border-b bg-muted/30 px-4 py-2">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">Clique em uma célula para adicionar ou em uma reserva para editar.</span>
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
                  <ArrowLeftRight className="size-4 text-purple-500" />
                  <span>Trocar</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trash2 className="size-4 text-red-500" />
                  <span>Remover</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and info bar */}
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
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Exibindo</span>
              <Badge variant="secondary" className="font-mono">
                {roomsCount}
              </Badge>
              <span>de</span>
              <Badge variant="outline" className="font-mono">
                {totalRooms}
              </Badge>
              <span>salas</span>
            </div>

            {(selectedBuildings.length < buildings.length || 
              selectedRoomTypes.length < roomTypes.length || 
              searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedBuildings(buildings)
                  setSelectedRoomTypes(roomTypes)
                  setSearchQuery("")
                }}
                className="text-muted-foreground"
              >
                <X className="size-4 mr-1" />
                Limpar filtros
              </Button>
            )}
          </div>
        </div>

        {/* Scheduler */}
        <div className="flex-1 overflow-hidden">
          <RoomScheduler
            bookings={bookings}
            selectedRooms={filteredRooms}
            onCellClick={handleCellClick}
            onBookingClick={handleBookingClick}
            daysToShow={14}
          />
        </div>

        {/* Actions list when editing */}
        {isEditMode && editActions.length > 0 && (
          <div className="border-t bg-muted/30 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-sm">Alterações pendentes</h3>
              <Button variant="ghost" size="sm" onClick={() => setEditActions([])}>
                Limpar tudo
              </Button>
            </div>
            <ScrollArea className="max-h-32">
              <div className="space-y-1">
                {editActions.map((action) => (
                  <div
                    key={action.id}
                    className="flex items-center gap-2 text-sm py-1 px-2 rounded bg-background"
                  >
                    {getActionIcon(action.type)}
                    <span className="flex-1">{action.description}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(action.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* New booking dialog */}
        <NewBookingDialog
          open={newBookingOpen}
          onOpenChange={setNewBookingOpen}
          onSubmit={handleNewBooking}
          preselectedRoom={preselectedRoom}
          preselectedDate={preselectedDate}
        />

        {/* Edit booking dialog */}
        <Dialog open={editBookingDialog} onOpenChange={setEditBookingDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar Reserva</DialogTitle>
              <DialogDescription>
                Faça as alterações necessárias na reserva selecionada.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Sala</Label>
                <Select value={editRoom} onValueChange={setEditRoom}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.name} - {room.building}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Horário Início</Label>
                  <Select value={editStartTime} onValueChange={setEditStartTime}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((slot) => (
                        <SelectItem key={slot.id} value={slot.startTime}>
                          {slot.startTime} - {slot.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Horário Fim</Label>
                  <Select value={editEndTime} onValueChange={setEditEndTime}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((slot) => (
                        <SelectItem key={slot.id} value={slot.endTime}>
                          {slot.endTime} - {slot.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteConfirmDialog(true)}
                >
                  <Trash2 className="size-4 mr-2" />
                  Remover
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openSwapDialog}
                >
                  <ArrowLeftRight className="size-4 mr-2" />
                  Trocar
                </Button>
              </div>
              <div className="flex gap-2 sm:ml-auto">
                <Button variant="outline" onClick={() => setEditBookingDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleEditBooking}>
                  <Save className="size-4 mr-2" />
                  Salvar
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Swap dialog */}
        <Dialog open={swapDialog} onOpenChange={setSwapDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Trocar Reserva</DialogTitle>
              <DialogDescription>
                Selecione o usuário e a reserva para trocar com a atual.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {selectedBooking && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="font-medium">{selectedBooking.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {rooms.find((r) => r.id === selectedBooking.roomId)?.name} | {selectedBooking.date} | {selectedBooking.startTime} - {selectedBooking.endTime}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex items-center gap-2 justify-center text-muted-foreground">
                <ArrowLeftRight className="size-5" />
                <span>trocar com</span>
              </div>

              <div className="space-y-2">
                <Label>Selecione o usuário</Label>
                <Select value={swapUserId} onValueChange={setSwapUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um usuário..." />
                  </SelectTrigger>
                  <SelectContent>
                    {mockUsers
                      .filter((u) => u.id !== selectedBooking?.userId)
                      .map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {swapUserId && (
                <div className="space-y-2">
                  <Label>Selecione a reserva para trocar</Label>
                  <Select value={swapBookingId} onValueChange={setSwapBookingId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha uma reserva..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSwapBookings.map((booking) => (
                        <SelectItem key={booking.id} value={booking.id}>
                          {booking.title} - {booking.date} {booking.startTime}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {availableSwapBookings.length === 0 && swapUserId && (
                <div className="text-center text-sm text-muted-foreground py-4">
                  <AlertCircle className="size-8 mx-auto mb-2 opacity-50" />
                  Este usuário não possui reservas disponíveis para troca.
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSwapDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSwapBooking} disabled={!swapBookingId}>
                <ArrowLeftRight className="size-4 mr-2" />
                Confirmar Troca
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete confirm dialog */}
        <AlertDialog open={deleteConfirmDialog} onOpenChange={setDeleteConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover Reserva</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover esta reserva? Esta ação pode ser desfeita enquanto o modo de edição estiver ativo.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteBooking} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Cancel edit dialog */}
        <AlertDialog open={cancelEditDialog} onOpenChange={setCancelEditDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancelar Edições</AlertDialogTitle>
              <AlertDialogDescription>
                Você tem {editActions.length} alteração(ões) não salva(s). Deseja realmente cancelar e perder todas as alterações?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Voltar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmCancelEdit} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Descartar Alterações
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Submit changes dialog */}
        <Dialog open={submitDialog} onOpenChange={setSubmitDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {isAdmin ? "Salvar Alterações" : "Enviar para Aprovação"}
              </DialogTitle>
              <DialogDescription>
                {isAdmin
                  ? "As alterações serão aplicadas imediatamente."
                  : "Suas alterações serão enviadas para aprovação de um coordenador ou administrador."}
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
                <Label>Mensagem (opcional)</Label>
                <Textarea
                  value={submitMessage}
                  onChange={(e) => setSubmitMessage(e.target.value)}
                  placeholder="Adicione uma justificativa ou observação..."
                  rows={3}
                />
              </div>

              {!isAdmin && (
                <div className="flex items-start gap-2 p-3 bg-yellow-500/10 rounded-md text-yellow-600 dark:text-yellow-400">
                  <AlertCircle className="size-5 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    Como professor/funcionário, suas alterações precisam ser aprovadas por um coordenador ou administrador antes de serem aplicadas.
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSubmitDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={submitChanges}>
                {isAdmin ? (
                  <>
                    <Check className="size-4 mr-2" />
                    Salvar
                  </>
                ) : (
                  <>
                    <Send className="size-4 mr-2" />
                    Enviar
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* History sheet */}
        <Sheet open={historySheetOpen} onOpenChange={setHistorySheetOpen}>
          <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col">
            <SheetHeader className="px-6 py-5 border-b bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <History className="size-5 text-primary" />
                </div>
                <div>
                  <SheetTitle className="text-lg">Histórico de Edições</SheetTitle>
                  <SheetDescription className="text-sm">
                    {editHistory.length} sessão(ões) de edição registrada(s)
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {editHistory.map((session, index) => {
                  const isExpanded = selectedSession?.id === session.id
                  const statusColors = {
                    aprovada: "bg-emerald-500",
                    rejeitada: "bg-red-500",
                    pendente_aprovacao: "bg-amber-500",
                    em_edicao: "bg-blue-500",
                  }
                  
                  return (
                    <div
                      key={session.id}
                      className={cn(
                        "group relative rounded-xl border bg-card transition-all duration-200",
                        isExpanded ? "shadow-md border-border" : "hover:border-muted-foreground/30 hover:shadow-sm"
                      )}
                    >
                      {/* Main card content */}
                      <button
                        className="w-full text-left p-4"
                        onClick={() => setSelectedSession(isExpanded ? null : session)}
                      >
                        <div className="flex items-start gap-4">
                          {/* Avatar */}
                          <div className={cn(
                            "flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                            session.status === "aprovada" ? "bg-emerald-500/15 text-emerald-600" :
                            session.status === "rejeitada" ? "bg-red-500/15 text-red-600" :
                            session.status === "pendente_aprovacao" ? "bg-amber-500/15 text-amber-600" :
                            "bg-blue-500/15 text-blue-600"
                          )}>
                            {session.userName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </div>
                          
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="font-semibold text-foreground truncate">
                                {session.userName}
                              </span>
                              {getStatusBadge(session.status)}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                              <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                {session.userRole}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="size-3" />
                                {formatDateTime(session.startedAt)}
                              </span>
                            </div>
                            
                            {session.message && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                {session.message}
                              </p>
                            )}
                            
                            {/* Action summary pills */}
                            <div className="flex flex-wrap gap-1.5">
                              {(() => {
                                const addCount = session.actions.filter(a => a.type === "add").length
                                const editCount = session.actions.filter(a => a.type === "edit").length
                                const swapCount = session.actions.filter(a => a.type === "swap").length
                                const removeCount = session.actions.filter(a => a.type === "remove").length
                                return (
                                  <>
                                    {addCount > 0 && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-emerald-500/10 text-emerald-600">
                                        <Plus className="size-3" />
                                        {addCount} nova(s)
                                      </span>
                                    )}
                                    {editCount > 0 && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-500/10 text-blue-600">
                                        <Edit3 className="size-3" />
                                        {editCount} edição(ões)
                                      </span>
                                    )}
                                    {swapCount > 0 && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-purple-500/10 text-purple-600">
                                        <ArrowLeftRight className="size-3" />
                                        {swapCount} troca(s)
                                      </span>
                                    )}
                                    {removeCount > 0 && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-500/10 text-red-600">
                                        <Trash2 className="size-3" />
                                        {removeCount} remoção(ões)
                                      </span>
                                    )}
                                  </>
                                )
                              })()}
                            </div>
                          </div>
                          
                          {/* Expand indicator */}
                          <ChevronDown className={cn(
                            "size-5 text-muted-foreground transition-transform shrink-0",
                            isExpanded && "rotate-180"
                          )} />
                        </div>
                      </button>

                      {/* Expanded content */}
                      {isExpanded && (
                        <div className="px-5 pb-4 space-y-4 border-t mx-4 pt-4">
                          {/* Timeline of actions */}
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                              Linha do Tempo
                            </h4>
                            <div className="relative pl-4 space-y-3">
                              {/* Vertical line */}
                              <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border" />
                              
                              {session.actions.map((action, actionIndex) => (
                                <div key={action.id} className="relative flex gap-3">
                                  {/* Dot */}
                                  <div className={cn(
                                    "absolute -left-4 top-1.5 size-3.5 rounded-full border-2 border-background",
                                    action.type === "add" ? "bg-emerald-500" :
                                    action.type === "edit" ? "bg-blue-500" :
                                    action.type === "swap" ? "bg-purple-500" :
                                    "bg-red-500"
                                  )} />
                                  
                                  {/* Content */}
                                  <div className="flex-1 pb-1">
                                    <div className="flex items-start gap-2">
                                      <div className={cn(
                                        "p-1.5 rounded-md shrink-0",
                                        action.type === "add" ? "bg-emerald-500/10 text-emerald-600" :
                                        action.type === "edit" ? "bg-blue-500/10 text-blue-600" :
                                        action.type === "swap" ? "bg-purple-500/10 text-purple-600" :
                                        "bg-red-500/10 text-red-600"
                                      )}>
                                        {getActionIcon(action.type)}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground">
                                          {action.description}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                          {formatDateTime(action.timestamp)}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Review section */}
                          {session.reviewedBy && (
                            <div className="rounded-lg bg-muted/50 p-3">
                              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                Revisão
                              </h4>
                              <div className="flex items-start gap-3">
                                <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                                  <Check className="size-4" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">
                                    Revisado por {mockUsers.find(u => u.id === session.reviewedBy)?.name}
                                  </p>
                                  {session.reviewMessage && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      "{session.reviewMessage}"
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Admin actions for pending sessions */}
                          {isAdmin && session.status === "pendente_aprovacao" && (
                            <div className="flex gap-2 pt-2">
                              <Button size="sm" variant="outline" className="flex-1 h-9">
                                <X className="size-4 mr-2" />
                                Rejeitar
                              </Button>
                              <Button size="sm" className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-700">
                                <Check className="size-4 mr-2" />
                                Aprovar
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}

                {editHistory.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="flex size-16 items-center justify-center rounded-full bg-muted mb-4">
                      <History className="size-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      Nenhum histórico
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-[240px]">
                      As sessões de edição da grade aparecerão aqui quando forem realizadas.
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </SidebarInset>
    </SidebarProvider>
  )
}
