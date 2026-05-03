import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import {
  Plus,
  Search,
  DoorOpen,
  Users,
  MapPin,
  Building2,
  Pencil,
  Trash2,
  Eye,
  MoreHorizontal,
  Check,
  Monitor,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Mic,
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAPI } from '@/hooks/use-api'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import type { components } from '@/api/schema'
import { LoadingAuthenticated } from '@/components/loading-authenticated'
import { RoomFormDialog } from '@/components/room/room-form-dialog'
import { DeleteRoomDialog } from '@/components/room/delete-room-dialog'

type RoomResponse = components['schemas']['RoomResponse']

export const Route = createFileRoute('/_authenticated/rooms/')({
  component: RoomsPage,
  loader: async ({ context: { api } }) => {
    await api.rooms.findAll1.prefetchQuery()
  },
  pendingComponent: LoadingAuthenticated,
})

const roomTypes = [
  { value: 'sala_aula', label: 'Sala de Aula' },
  { value: 'laboratorio', label: 'Laboratório' },
  { value: 'auditorio', label: 'Auditório' },
  { value: 'sala_reuniao', label: 'Sala de Reunião' },
]

function getRoomTypeName(type: string) {
  return roomTypes.find((t) => t.value === type)?.label ?? type
}

function getRoomTypeColor(type: string) {
  switch (type) {
    case 'sala_aula':
      return 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30'
    case 'laboratorio':
      return 'bg-blue-500/20 text-blue-600 border-blue-500/30'
    case 'auditorio':
      return 'bg-amber-500/20 text-amber-600 border-amber-500/30'
    case 'sala_reuniao':
      return 'bg-purple-500/20 text-purple-600 border-purple-500/30'
    default:
      return 'bg-gray-500/20 text-gray-600 border-gray-500/30'
  }
}

function getRoomTypeIcon(type: string) {
  switch (type) {
    case 'sala_aula':
      return DoorOpen
    case 'laboratorio':
      return Monitor
    case 'auditorio':
      return Mic
    case 'sala_reuniao':
      return Users
    default:
      return DoorOpen
  }
}

function parseResources(resources?: string): string[] {
  if (!resources) return []
  try {
    const parsed = JSON.parse(resources)
    return Array.isArray(parsed) ? parsed : [String(resources)]
  } catch {
    return resources.split(',').map((r) => r.trim()).filter(Boolean)
  }
}

function RoomsPage() {
  const { api } = useAPI()
  const { user } = useAuth()


  const isAdmin = user?.role === 'ADMIN'

  console.log(user)

  const { data: rooms = [] } = api.rooms.findAll1.useSuspenseQuery()
  const roomList = Array.isArray(rooms) ? (rooms as RoomResponse[]) : []

  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterBuilding, setFilterBuilding] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(6)

  const [viewRoom, setViewRoom] = useState<RoomResponse | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<RoomResponse | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [roomToDelete, setRoomToDelete] = useState<RoomResponse | null>(null)

  const buildings = useMemo(() => {
    const set = new Set(roomList.map((r) => r.building).filter(Boolean))
    return Array.from(set) as string[]
  }, [roomList])

  const filteredRooms = useMemo(() => {
    return roomList.filter((room) => {
      const matchesSearch =
        room.name?.toLowerCase().includes(search.toLowerCase()) ||
        room.code?.toLowerCase().includes(search.toLowerCase())
      const matchesType = filterType === 'all' || room.type === filterType
      const matchesBuilding =
        filterBuilding === 'all' || room.building === filterBuilding
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && room.isActive === true) ||
        (filterStatus === 'inactive' && room.isActive === false)
      return matchesSearch && matchesType && matchesBuilding && matchesStatus
    })
  }, [roomList, search, filterType, filterBuilding, filterStatus])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, filterType, filterBuilding, filterStatus])

  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage)
  const paginatedRooms = filteredRooms.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )

  const stats = useMemo(
    () => ({
      total: roomList.length,
      active: roomList.filter((r) => r.isActive).length,
      labs: roomList.filter((r) => r.type === 'laboratorio').length,
      capacity: roomList.reduce((acc, r) => acc + (r.capacity ?? 0), 0),
    }),
    [roomList],
  )

  function openCreate() {
    setEditingRoom(null)
    setIsFormOpen(true)
  }

  function openEdit(room: RoomResponse) {
    setEditingRoom(room)
    setIsFormOpen(true)
  }

  function openDelete(room: RoomResponse) {
    setRoomToDelete(room)
    setIsDeleteOpen(true)
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <DoorOpen className="size-5 text-primary" />
          <h1 className="text-lg font-semibold">Gerenciamento de Salas</h1>
        </div>
        {isAdmin && (
          <Button onClick={openCreate}>
            <Plus className="mr-2 size-4" />
            Nova Sala
          </Button>
        )}
      </header>

      <main className="flex-1 overflow-auto p-6">
        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <DoorOpen className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total de Salas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Check className="size-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.active}</p>
                  <p className="text-sm text-muted-foreground">Salas Ativas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <Monitor className="size-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.labs}</p>
                  <p className="text-sm text-muted-foreground">Laboratórios</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10">
                  <Users className="size-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.capacity}</p>
                  <p className="text-sm text-muted-foreground">Capacidade Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative min-w-50 flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou código..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-45">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {roomTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterBuilding} onValueChange={setFilterBuilding}>
                <SelectTrigger className="w-37.5">
                  <SelectValue placeholder="Prédio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os prédios</SelectItem>
                  {buildings.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-37.5">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativas</SelectItem>
                  <SelectItem value="inactive">Inativas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Room grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {paginatedRooms.map((room) => {
            const TypeIcon = getRoomTypeIcon(room.type ?? '')
            const typeColor = getRoomTypeColor(room.type ?? '')
            const resources = parseResources(room.resources)
            return (
              <Card
                key={room.id}
                className={cn(
                  'group transition-all hover:shadow-md',
                  !room.isActive && 'opacity-60',
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'flex size-10 items-center justify-center rounded-lg',
                          typeColor.split(' ')[0],
                        )}
                      >
                        <TypeIcon
                          className={cn('size-5', typeColor.split(' ')[1])}
                        />
                      </div>
                      <div>
                        <CardTitle className="text-base">{room.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {room.code}
                        </CardDescription>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewRoom(room)}>
                          <Eye className="mr-2 size-4" />
                          Ver Ficha
                        </DropdownMenuItem>
                        {isAdmin && (
                          <>
                            <DropdownMenuItem onClick={() => openEdit(room)}>
                              <Pencil className="mr-2 size-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openDelete(room)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 size-4" />
                              Excluir
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <Badge variant="outline" className={typeColor}>
                      {getRoomTypeName(room.type ?? '')}
                    </Badge>
                    <Badge variant={room.isActive ? 'default' : 'secondary'}>
                      {room.isActive ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="size-4" />
                      <span>{room.building}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="size-4" />
                      <span>
                        {room.floor === 0 ? 'Térreo' : `${room.floor}º Andar`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="size-4" />
                      <span>{room.capacity} lugares</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {resources.slice(0, 3).map((r) => (
                      <Badge key={r} variant="secondary" className="text-xs">
                        {r}
                      </Badge>
                    ))}
                    {resources.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{resources.length - 3}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setViewRoom(room)}
                  >
                    Ver Detalhes
                    <ChevronRight className="ml-2 size-4" />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredRooms.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <DoorOpen className="mb-4 size-12 text-muted-foreground" />
            <h3 className="text-lg font-medium">Nenhuma sala encontrada</h3>
            <p className="text-sm text-muted-foreground">
              Tente ajustar os filtros ou criar uma nova sala.
            </p>
          </div>
        )}

        {/* Pagination */}
        {filteredRooms.length > 0 && (
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Mostrando</span>
              <Select
                value={String(itemsPerPage)}
                onValueChange={(v) => {
                  setItemsPerPage(Number(v))
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="h-8 w-16">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['6', '12', '24', '48'].map((n) => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>de {filteredRooms.length} sala(s)</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <div className="flex items-center gap-1 px-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    if (totalPages <= 5) return true
                    if (page === 1 || page === totalPages) return true
                    return Math.abs(page - currentPage) <= 1
                  })
                  .map((page, index, arr) => (
                    <span key={page} className="flex items-center">
                      {index > 0 && page - arr[index - 1] > 1 && (
                        <span className="px-1 text-muted-foreground">...</span>
                      )}
                      <Button
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="icon"
                        className="size-8"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    </span>
                  ))}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                <ChevronsRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* View Room Dialog */}
      <Dialog open={!!viewRoom} onOpenChange={() => setViewRoom(null)}>
        <DialogContent className="max-w-2xl">
          {viewRoom && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {(() => {
                    const Icon = getRoomTypeIcon(viewRoom.type ?? '')
                    const color = getRoomTypeColor(viewRoom.type ?? '')
                    return (
                      <div
                        className={cn(
                          'flex size-10 items-center justify-center rounded-lg',
                          color.split(' ')[0],
                        )}
                      >
                        <Icon className={cn('size-5', color.split(' ')[1])} />
                      </div>
                    )
                  })()}
                  <div>
                    <span>{viewRoom.name}</span>
                    <p className="text-sm font-normal text-muted-foreground">
                      {viewRoom.code}
                    </p>
                  </div>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Tipo</p>
                    <Badge
                      variant="outline"
                      className={getRoomTypeColor(viewRoom.type ?? '')}
                    >
                      {getRoomTypeName(viewRoom.type ?? '')}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={viewRoom.isActive ? 'default' : 'secondary'}>
                      {viewRoom.isActive ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Prédio</p>
                    <p className="font-medium">{viewRoom.building}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Andar</p>
                    <p className="font-medium">
                      {viewRoom.floor === 0
                        ? 'Térreo'
                        : `${viewRoom.floor}º Andar`}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Capacidade</p>
                    <p className="font-medium">{viewRoom.capacity} lugares</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Código</p>
                    <p className="font-medium font-mono">{viewRoom.code}</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-3">
                  <p className="text-sm font-medium">Recursos Disponíveis</p>
                  <div className="flex flex-wrap gap-2">
                    {parseResources(viewRoom.resources).map((r) => (
                      <Badge key={r} variant="secondary" className="px-3 py-1">
                        {r}
                      </Badge>
                    ))}
                    {parseResources(viewRoom.resources).length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Nenhum recurso cadastrado
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setViewRoom(null)}>
                  Fechar
                </Button>
                {isAdmin && (
                  <Button
                    onClick={() => {
                      openEdit(viewRoom)
                      setViewRoom(null)
                    }}
                  >
                    <Pencil className="mr-2 size-4" />
                    Editar
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <RoomFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        editingRoom={editingRoom}
      />

      <DeleteRoomDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        room={roomToDelete}
      />
    </>
  )
}
