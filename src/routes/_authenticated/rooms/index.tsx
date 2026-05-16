import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Plus,
  Search,
  DoorOpen,
  Users,
  Building2,
  Pencil,
  Trash2,
  Eye,
  MoreHorizontal,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Wrench,
  MapPin,
  CheckCircle2,
  XCircle,
  Archive,
  RotateCcw,
} from 'lucide-react'
import { ResourcesIconsList } from '@/lib/resources-icons'
import { RoomTypeIconsList } from '@/lib/room-type-icons'
import { Separator } from '@/components/ui/separator'
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
import { toast } from 'sonner'

type RoomDetailResponse = components['schemas']['RoomDetailResponse']
type BuildingResponse = components['schemas']['BuildingResponse']
type RoomTypeResponse = components['schemas']['RoomTypeResponse']

export const Route = createFileRoute('/_authenticated/rooms/')({
  component: RoomsPage,
  loader: async ({ context: { api } }) => {
    await Promise.all([
      api.rooms.listRooms.prefetchQuery(),
      api.buildings.listBuildings.prefetchQuery(),
      api.roomTypes.listRoomTypes.prefetchQuery(),
    ])
  },
  pendingComponent: LoadingAuthenticated,
})

function getRoomStatusLabel(status?: string) {
  switch (status) {
    case 'AVAILABLE': return 'Disponível'
    case 'MAINTENANCE': return 'Em Manutenção'
    case 'INACTIVE': return 'Inativa'
    case 'ARCHIVED': return 'Arquivada'
    default: return status ?? 'N/A'
  }
}

function getRoomStatusVariant(status?: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'AVAILABLE': return 'default'
    case 'MAINTENANCE': return 'outline'
    default: return 'secondary'
  }
}

function RoomsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const { api } = useAPI()

  const { data: roomsRaw = [] } = api.rooms.listRooms.useSuspenseQuery({
    query: { expand: ['building', 'roomType', 'resources'] },
  })
  const { data: buildingsRaw = [] } = api.buildings.listBuildings.useSuspenseQuery()
  const { data: roomTypesRaw = [] } = api.roomTypes.listRoomTypes.useSuspenseQuery()

  const rooms = (Array.isArray(roomsRaw) ? roomsRaw : []) as RoomDetailResponse[]
  const buildings = (Array.isArray(buildingsRaw) ? buildingsRaw : []) as BuildingResponse[]
  const roomTypes = (Array.isArray(roomTypesRaw) ? roomTypesRaw : []) as RoomTypeResponse[]

  const buildingMap = useMemo(
    () => new Map(buildings.map((b) => [b.id, b])),
    [buildings],
  )
  const roomTypeMap = useMemo(
    () => new Map(roomTypes.map((rt) => [rt.id, rt])),
    [roomTypes],
  )

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterBuilding, setFilterBuilding] = useState('all')
  const [filterRoomType, setFilterRoomType] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(6)

  const [viewRoom, setViewRoom] = useState<RoomDetailResponse | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<RoomDetailResponse | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [roomToDelete, setRoomToDelete] = useState<RoomDetailResponse | null>(null)

  const statusMutation = api.rooms.updateRoomStatus.useMutation()

  const handleUpdateStatus = useCallback(
    async (room: RoomDetailResponse, status: 'AVAILABLE' | 'MAINTENANCE' | 'INACTIVE' | 'ARCHIVED') => {
      try {
        await statusMutation.mutateAsync({ path: { id: room.id! }, body: { status } })
        await api.rooms.listRooms.invalidateQueries()
        const labels: Record<string, string> = {
          AVAILABLE: 'disponível',
          MAINTENANCE: 'em manutenção',
          INACTIVE: 'inativa',
          ARCHIVED: 'arquivada',
        }
        toast.success(`Sala marcada como ${labels[status]}.`)
      } catch {
        toast.error('Erro ao atualizar status da sala.')
      }
    },
    [statusMutation, api],
  )

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const buildingName =
        room.building?.name ?? buildingMap.get(room.buildingId ?? '')?.name ?? ''
      const matchesSearch =
        room.name?.toLowerCase().includes(search.toLowerCase()) ||
        room.code?.toLowerCase().includes(search.toLowerCase()) ||
        buildingName.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = filterStatus === 'all' || room.status === filterStatus
      const matchesBuilding = filterBuilding === 'all' || room.buildingId === filterBuilding
      const matchesRoomType = filterRoomType === 'all' || room.roomTypeId === filterRoomType
      return matchesSearch && matchesStatus && matchesBuilding && matchesRoomType
    })
  }, [rooms, search, filterStatus, filterBuilding, filterRoomType, buildingMap])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, filterStatus, filterBuilding, filterRoomType])

  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage)
  const paginatedRooms = filteredRooms.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )

  const stats = useMemo(
    () => ({
      total: rooms.length,
      available: rooms.filter((r) => r.status === 'AVAILABLE').length,
      maintenance: rooms.filter((r) => r.status === 'MAINTENANCE').length,
      capacity: rooms.reduce((acc, r) => acc + (r.capacity ?? 0), 0),
    }),
    [rooms],
  )

  function openCreate() {
    setEditingRoom(null)
    setIsFormOpen(true)
  }

  function openEdit(room: RoomDetailResponse) {
    setEditingRoom(room)
    setIsFormOpen(true)
  }

  function openDelete(room: RoomDetailResponse) {
    setRoomToDelete(room)
    setIsDeleteOpen(true)
  }

  return (
    <>
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
                <CheckCircle2 className="size-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.available}</p>
                <p className="text-sm text-muted-foreground">Disponíveis</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Wrench className="size-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.maintenance}</p>
                <p className="text-sm text-muted-foreground">Em Manutenção</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Users className="size-5 text-blue-500" />
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
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-1 flex-wrap items-center gap-3">
              <div className="relative min-w-52 flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou código..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="AVAILABLE">Disponível</SelectItem>
                  <SelectItem value="MAINTENANCE">Em Manutenção</SelectItem>
                  <SelectItem value="INACTIVE">Inativa</SelectItem>
                  <SelectItem value="ARCHIVED">Arquivada</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterBuilding} onValueChange={setFilterBuilding}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Prédio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os prédios</SelectItem>
                  {buildings.map((b) => (
                    <SelectItem key={b.id} value={b.id!}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterRoomType} onValueChange={setFilterRoomType}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {roomTypes.map((rt) => (
                    <SelectItem key={rt.id} value={rt.id!}>
                      {rt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isAdmin && (
              <Button onClick={openCreate}>
                <Plus className="mr-2 size-4" />
                Nova Sala
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Room Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {paginatedRooms.map((room) => {
          const buildingName =
            room.building?.name ??
            buildingMap.get(room.buildingId ?? '')?.name ??
            'N/A'
          const roomTypeName =
            room.roomType?.name ??
            roomTypeMap.get(room.roomTypeId ?? '')?.name ??
            'N/A'
          const resources = room.resources ?? []

          const roomType = room.roomType ?? roomTypeMap.get(room.roomTypeId ?? '')
          const RoomTypeIcon = RoomTypeIconsList[roomType?.icon ?? '']?.icon ?? DoorOpen

          return (
            <Card
              key={room.id}
              className={cn(
                'group transition-all hover:shadow-md',
                (room.status === 'INACTIVE' || room.status === 'ARCHIVED') && 'opacity-60',
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                      <RoomTypeIcon className="size-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{room.name}</CardTitle>
                      <CardDescription className="text-xs">{room.code}</CardDescription>
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
                          {room.status !== 'AVAILABLE' && (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(room, 'AVAILABLE')}>
                              <CheckCircle2 className="mr-2 size-4 text-emerald-500" />
                              Marcar como Disponível
                            </DropdownMenuItem>
                          )}
                          {room.status !== 'MAINTENANCE' && (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(room, 'MAINTENANCE')}>
                              <Wrench className="mr-2 size-4 text-amber-500" />
                              Marcar em Manutenção
                            </DropdownMenuItem>
                          )}
                          {room.status !== 'INACTIVE' && room.status !== 'ARCHIVED' && (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(room, 'INACTIVE')}>
                              <XCircle className="mr-2 size-4" />
                              Desativar
                            </DropdownMenuItem>
                          )}
                          {room.status !== 'ARCHIVED' && (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(room, 'ARCHIVED')}>
                              <Archive className="mr-2 size-4" />
                              Arquivar
                            </DropdownMenuItem>
                          )}
                          {(room.status === 'INACTIVE' || room.status === 'ARCHIVED') && (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(room, 'AVAILABLE')}>
                              <RotateCcw className="mr-2 size-4" />
                              Restaurar
                            </DropdownMenuItem>
                          )}
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
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {roomTypeName}
                  </Badge>
                  <Badge variant={getRoomStatusVariant(room.status)}>
                    {getRoomStatusLabel(room.status)}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Building2 className="size-4" />
                    <span className="truncate">{buildingName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4" />
                    <span>{room.floor === 0 ? 'Térreo' : `${room.floor}º Andar`}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="size-4" />
                    <span>{room.capacity} lugares</span>
                  </div>
                </div>
                {resources.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {resources.slice(0, 3).map((r) => {
                      const ResourceIcon = ResourcesIconsList[r.icon ?? '']?.icon
                      return (
                        <Badge key={r.id} variant="secondary" className="gap-1 text-xs">
                          {ResourceIcon && <ResourceIcon className="size-3" />}
                          {r.name}
                        </Badge>
                      )
                    })}
                    {resources.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{resources.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
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

      {/* View Room Dialog */}
      <Dialog open={!!viewRoom} onOpenChange={() => setViewRoom(null)}>
        <DialogContent className="max-w-2xl">
          {viewRoom && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {(() => {
                    const vRoomType = viewRoom.roomType ?? roomTypeMap.get(viewRoom.roomTypeId ?? '')
                    const ViewRoomTypeIcon = RoomTypeIconsList[vRoomType?.icon ?? '']?.icon ?? DoorOpen
                    return (
                      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                        <ViewRoomTypeIcon className="size-5 text-primary" />
                      </div>
                    )
                  })()}
                  <div>
                    <span>{viewRoom.name}</span>
                    <p className="text-sm font-normal text-muted-foreground">{viewRoom.code}</p>
                  </div>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Tipo</p>
                    <Badge variant="outline">
                      {viewRoom.roomType?.name ??
                        roomTypeMap.get(viewRoom.roomTypeId ?? '')?.name ??
                        'N/A'}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={getRoomStatusVariant(viewRoom.status)}>
                      {getRoomStatusLabel(viewRoom.status)}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Prédio</p>
                    <p className="font-medium">
                      {viewRoom.building?.name ??
                        buildingMap.get(viewRoom.buildingId ?? '')?.name ??
                        'N/A'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Andar</p>
                    <p className="font-medium">
                      {viewRoom.floor === 0 ? 'Térreo' : `${viewRoom.floor}º Andar`}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Capacidade</p>
                    <p className="font-medium">{viewRoom.capacity} lugares</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Código</p>
                    <p className="font-mono font-medium">{viewRoom.code}</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-3">
                  <p className="text-sm font-medium">Recursos Disponíveis</p>
                  <div className="flex flex-wrap gap-2">
                    {(viewRoom.resources ?? []).map((r) => {
                      const ResourceIcon = ResourcesIconsList[r.icon ?? '']?.icon
                      return (
                        <Badge key={r.id} variant="secondary" className="gap-1.5 px-3 py-1">
                          {ResourceIcon && <ResourceIcon className="size-3.5" />}
                          {r.name}
                        </Badge>
                      )
                    })}
                    {(viewRoom.resources ?? []).length === 0 && (
                      <p className="text-sm text-muted-foreground">Nenhum recurso cadastrado</p>
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
