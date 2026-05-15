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
  Package,
  Layers,
  MapPin,
  CheckCircle2,
  XCircle,
  Archive,
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
  DialogDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Label } from '@/components/ui/label'
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
type ResourceResponse = components['schemas']['ResourceResponse']

export const Route = createFileRoute('/_authenticated/rooms/')({
  component: RoomsPage,
  loader: async ({ context: { api } }) => {
    await Promise.all([
      api.rooms.listRooms.prefetchQuery(),
      api.buildings.listBuildings.prefetchQuery(),
      api.roomTypes.listRoomTypes.prefetchQuery(),
      api.resources.listResources.prefetchQuery(),
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

function getBuildingStatusLabel(status?: string) {
  switch (status) {
    case 'ACTIVE': return 'Ativo'
    case 'INACTIVE': return 'Inativo'
    case 'ARCHIVED': return 'Arquivado'
    default: return status ?? 'N/A'
  }
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function RoomsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <DoorOpen className="size-5 text-primary" />
        <h1 className="text-lg font-semibold">Gerenciamento de Salas</h1>
      </header>

      <main className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="rooms">
          <TabsList className="mb-6">
            <TabsTrigger value="rooms" className="flex items-center gap-2">
              <DoorOpen className="size-4" />
              Salas
            </TabsTrigger>
            <TabsTrigger value="buildings" className="flex items-center gap-2">
              <Building2 className="size-4" />
              Prédios
            </TabsTrigger>
            <TabsTrigger value="room-types" className="flex items-center gap-2">
              <Layers className="size-4" />
              Tipos de Sala
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-2">
              <Package className="size-4" />
              Recursos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rooms">
            <RoomsTab isAdmin={isAdmin} />
          </TabsContent>
          <TabsContent value="buildings">
            <BuildingsTab isAdmin={isAdmin} />
          </TabsContent>
          <TabsContent value="room-types">
            <RoomTypesTab isAdmin={isAdmin} />
          </TabsContent>
          <TabsContent value="resources">
            <ResourcesTab isAdmin={isAdmin} />
          </TabsContent>
        </Tabs>
      </main>
    </>
  )
}

// ─── Rooms Tab ────────────────────────────────────────────────────────────────

function RoomsTab({ isAdmin }: { isAdmin: boolean }) {
  const { api } = useAPI()

  const { data: roomsRaw = [] } = api.rooms.listRooms.useSuspenseQuery({
    query: {
      expand: ['building', 'roomType', 'resources']
    }
  })
  const { data: buildingsRaw = [] } = api.buildings.listBuildings.useSuspenseQuery()
  const { data: roomTypesRaw = [] } =
    api.roomTypes.listRoomTypes.useSuspenseQuery()

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

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const buildingName =
        room.building?.name ?? buildingMap.get(room.buildingId ?? '')?.name ?? ''
      const matchesSearch =
        room.name?.toLowerCase().includes(search.toLowerCase()) ||
        room.code?.toLowerCase().includes(search.toLowerCase()) ||
        buildingName.toLowerCase().includes(search.toLowerCase())
      const matchesStatus =
        filterStatus === 'all' || room.status === filterStatus
      const matchesBuilding =
        filterBuilding === 'all' || room.buildingId === filterBuilding
      const matchesRoomType =
        filterRoomType === 'all' || room.roomTypeId === filterRoomType
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

          return (
            <Card
              key={room.id}
              className={cn(
                'group transition-all hover:shadow-md',
                (room.status === 'INACTIVE' || room.status === 'ARCHIVED') &&
                  'opacity-60',
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                      <DoorOpen className="size-5 text-primary" />
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
                    <span>
                      {room.floor === 0 ? 'Térreo' : `${room.floor}º Andar`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="size-4" />
                    <span>{room.capacity} lugares</span>
                  </div>
                </div>
                {resources.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {resources.slice(0, 3).map((r) => (
                      <Badge key={r.id} variant="secondary" className="text-xs">
                        {r.icon ? `${r.icon} ` : ''}{r.name}
                      </Badge>
                    ))}
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
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
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
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <DoorOpen className="size-5 text-primary" />
                  </div>
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
                    <p className="font-mono font-medium">{viewRoom.code}</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-3">
                  <p className="text-sm font-medium">Recursos Disponíveis</p>
                  <div className="flex flex-wrap gap-2">
                    {(viewRoom.resources ?? []).map((r) => (
                      <Badge key={r.id} variant="secondary" className="px-3 py-1">
                        {r.icon ? `${r.icon} ` : ''}{r.name}
                      </Badge>
                    ))}
                    {(viewRoom.resources ?? []).length === 0 && (
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

// ─── Buildings Tab ────────────────────────────────────────────────────────────

const defaultBuildingForm = { name: '', address: '', totalFloors: '1' }

function BuildingsTab({ isAdmin }: { isAdmin: boolean }) {
  const { api } = useAPI()
  const { data: raw = [] } = api.buildings.listBuildings.useSuspenseQuery()
  const buildings = (Array.isArray(raw) ? raw : []) as BuildingResponse[]

  const createMutation = api.buildings.createBuilding.useMutation()
  const updateMutation = api.buildings.updateBuilding.useMutation()
  const deleteMutation = api.buildings.deleteBuilding.useMutation()
  const statusMutation = api.buildings.updateBuildingStatus.useMutation()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editing, setEditing] = useState<BuildingResponse | null>(null)
  const [form, setForm] = useState(defaultBuildingForm)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [toDelete, setToDelete] = useState<BuildingResponse | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = useMemo(
    () =>
      buildings.filter(
        (b) =>
          b.name?.toLowerCase().includes(search.toLowerCase()) ||
          b.address?.toLowerCase().includes(search.toLowerCase()),
      ),
    [buildings, search],
  )

  function openCreate() {
    setEditing(null)
    setForm(defaultBuildingForm)
    setIsFormOpen(true)
  }

  function openEdit(b: BuildingResponse) {
    setEditing(b)
    setForm({
      name: b.name ?? '',
      address: b.address ?? '',
      totalFloors: String(b.totalFloors ?? 1),
    })
    setIsFormOpen(true)
  }

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      const body = {
        name: form.name,
        address: form.address,
        totalFloors: parseInt(form.totalFloors),
      }
      if (editing?.id) {
        await updateMutation.mutateAsync({ path: { id: editing.id }, body })
        toast.success('Prédio atualizado com sucesso.')
      } else {
        await createMutation.mutateAsync({ body })
        toast.success('Prédio cadastrado com sucesso.')
      }
      await api.buildings.listBuildings.invalidateQueries()
      setIsFormOpen(false)
    } catch {
      toast.error(editing ? 'Erro ao atualizar prédio.' : 'Erro ao cadastrar prédio.')
    } finally {
      setTimeout(() => setIsSaving(false), 300)
    }
  }, [form, editing, createMutation, updateMutation, api])

  const handleDelete = useCallback(async () => {
    if (!toDelete?.id) return
    setIsDeleting(true)
    try {
      await deleteMutation.mutateAsync({ path: { id: toDelete.id } })
      await api.buildings.listBuildings.invalidateQueries()
      toast.success('Prédio excluído com sucesso.')
      setIsDeleteOpen(false)
    } catch {
      toast.error('Erro ao excluir prédio.')
    } finally {
      setTimeout(() => setIsDeleting(false), 300)
    }
  }, [toDelete, deleteMutation, api])

  const handleToggleStatus = useCallback(
    async (b: BuildingResponse) => {
      const next = b.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
      try {
        await statusMutation.mutateAsync({
          path: { id: b.id! },
          body: { status: next },
        })
        await api.buildings.listBuildings.invalidateQueries()
        toast.success(`Prédio ${next === 'ACTIVE' ? 'ativado' : 'desativado'}.`)
      } catch {
        toast.error('Erro ao atualizar status.')
      }
    },
    [statusMutation, api],
  )

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar prédio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {isAdmin && (
          <Button onClick={openCreate}>
            <Plus className="mr-2 size-4" />
            Novo Prédio
          </Button>
        )}
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Endereço</TableHead>
              <TableHead>Andares</TableHead>
              <TableHead>Status</TableHead>
              {isAdmin && <TableHead className="w-24">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={isAdmin ? 5 : 4}
                  className="py-8 text-center text-muted-foreground"
                >
                  Nenhum prédio encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {b.address || '—'}
                  </TableCell>
                  <TableCell>{b.totalFloors ?? '—'}</TableCell>
                  <TableCell>
                    <Badge
                      variant={b.status === 'ACTIVE' ? 'default' : 'secondary'}
                    >
                      {getBuildingStatusLabel(b.status)}
                    </Badge>
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(b)}>
                            <Pencil className="mr-2 size-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(b)}
                          >
                            {b.status === 'ACTIVE' ? (
                              <XCircle className="mr-2 size-4" />
                            ) : (
                              <CheckCircle2 className="mr-2 size-4" />
                            )}
                            {b.status === 'ACTIVE' ? 'Desativar' : 'Ativar'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setToDelete(b)
                              setIsDeleteOpen(true)
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 size-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Prédio' : 'Novo Prédio'}</DialogTitle>
            <DialogDescription>
              {editing
                ? 'Atualize as informações do prédio.'
                : 'Cadastre um novo prédio.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="b-name">Nome *</Label>
              <Input
                id="b-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Bloco A"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="b-address">Endereço</Label>
              <Input
                id="b-address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Ex: Rua das Flores, 123"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="b-floors">Total de Andares</Label>
              <Input
                id="b-floors"
                type="number"
                value={form.totalFloors}
                onChange={(e) =>
                  setForm({ ...form, totalFloors: e.target.value })
                }
                min={1}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!form.name || isSaving}
              className="min-w-32"
            >
              {isSaving ? 'Salvando...' : editing ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o prédio{' '}
              <strong>{toDelete?.name}</strong>? Esta ação não pode ser
              desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="mr-2 size-4" />
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Room Types Tab ───────────────────────────────────────────────────────────

const defaultRoomTypeForm = {
  name: '',
  description: '',
  defaultCapacity: '',
  color: '',
  icon: '',
}

function RoomTypesTab({ isAdmin }: { isAdmin: boolean }) {
  const { api } = useAPI()
  const { data: raw = [] } = api.roomTypes.listRoomTypes.useSuspenseQuery()
  const roomTypes = (Array.isArray(raw) ? raw : []) as RoomTypeResponse[]

  const createMutation = api.roomTypes.createRoomType.useMutation()
  const updateMutation = api.roomTypes.updateRoomType.useMutation()
  const deleteMutation = api.roomTypes.deleteRoomType.useMutation()
  const statusMutation = api.roomTypes.updateRoomTypeStatus.useMutation()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editing, setEditing] = useState<RoomTypeResponse | null>(null)
  const [form, setForm] = useState(defaultRoomTypeForm)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [toDelete, setToDelete] = useState<RoomTypeResponse | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = useMemo(
    () =>
      roomTypes.filter(
        (rt) =>
          rt.name?.toLowerCase().includes(search.toLowerCase()) ||
          rt.description?.toLowerCase().includes(search.toLowerCase()),
      ),
    [roomTypes, search],
  )

  function openCreate() {
    setEditing(null)
    setForm(defaultRoomTypeForm)
    setIsFormOpen(true)
  }

  function openEdit(rt: RoomTypeResponse) {
    setEditing(rt)
    setForm({
      name: rt.name ?? '',
      description: rt.description ?? '',
      defaultCapacity: rt.defaultCapacity ?? '',
      color: rt.color ?? '',
      icon: rt.icon ?? '',
    })
    setIsFormOpen(true)
  }

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      const body = {
        name: form.name,
        description: form.description || undefined,
        defaultCapacity: form.defaultCapacity || undefined,
        color: form.color || undefined,
        icon: form.icon || undefined,
      }
      if (editing?.id) {
        await updateMutation.mutateAsync({ path: { id: editing.id }, body })
        toast.success('Tipo de sala atualizado com sucesso.')
      } else {
        await createMutation.mutateAsync({ body })
        toast.success('Tipo de sala cadastrado com sucesso.')
      }
      await api.roomTypes.listRoomTypes.invalidateQueries()
      setIsFormOpen(false)
    } catch {
      toast.error(
        editing ? 'Erro ao atualizar tipo.' : 'Erro ao cadastrar tipo.',
      )
    } finally {
      setTimeout(() => setIsSaving(false), 300)
    }
  }, [form, editing, createMutation, updateMutation, api])

  const handleDelete = useCallback(async () => {
    if (!toDelete?.id) return
    setIsDeleting(true)
    try {
      await deleteMutation.mutateAsync({ path: { id: toDelete.id } })
      await api.roomTypes.listRoomTypes.invalidateQueries()
      toast.success('Tipo de sala excluído com sucesso.')
      setIsDeleteOpen(false)
    } catch {
      toast.error('Erro ao excluir tipo de sala.')
    } finally {
      setTimeout(() => setIsDeleting(false), 300)
    }
  }, [toDelete, deleteMutation, api])

  const handleToggleStatus = useCallback(
    async (rt: RoomTypeResponse) => {
      try {
        const next = rt.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
        await statusMutation.mutateAsync({
          path: { id: rt.id! },
          body: { status: next },
        })
        await api.roomTypes.listRoomTypes.invalidateQueries()
        toast.success(
          `Tipo ${next === 'INACTIVE' ? 'desativado' : 'ativado'} com sucesso.`,
        )
      } catch {
        toast.error('Erro ao atualizar status.')
      }
    },
    [statusMutation, api],
  )

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar tipo de sala..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {isAdmin && (
          <Button onClick={openCreate}>
            <Plus className="mr-2 size-4" />
            Novo Tipo
          </Button>
        )}
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Cap. Padrão</TableHead>
              <TableHead>Ícone</TableHead>
              <TableHead>Status</TableHead>
              {isAdmin && <TableHead className="w-24">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={isAdmin ? 6 : 5}
                  className="py-8 text-center text-muted-foreground"
                >
                  Nenhum tipo de sala encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((rt) => (
                <TableRow key={rt.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {rt.color && (
                        <span
                          className="inline-block size-3 rounded-full"
                          style={{ backgroundColor: rt.color }}
                        />
                      )}
                      {rt.name}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-48 truncate text-muted-foreground">
                    {rt.description || '—'}
                  </TableCell>
                  <TableCell>{rt.defaultCapacity || '—'}</TableCell>
                  <TableCell className="text-xl">
                    {rt.icon || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={rt.status === 'ACTIVE' ? 'default' : 'secondary'}
                    >
                      {rt.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(rt)}>
                            <Pencil className="mr-2 size-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(rt)}
                          >
                            {rt.status === 'ACTIVE' ? (
                              <XCircle className="mr-2 size-4" />
                            ) : (
                              <CheckCircle2 className="mr-2 size-4" />
                            )}
                            {rt.status === 'ACTIVE' ? 'Desativar' : 'Ativar'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setToDelete(rt)
                              setIsDeleteOpen(true)
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 size-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Editar Tipo de Sala' : 'Novo Tipo de Sala'}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? 'Atualize as informações do tipo de sala.'
                : 'Cadastre um novo tipo de sala.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rt-name">Nome *</Label>
              <Input
                id="rt-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Laboratório"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rt-desc">Descrição</Label>
              <Input
                id="rt-desc"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Descrição do tipo de sala"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rt-cap">Capacidade Padrão</Label>
                <Input
                  id="rt-cap"
                  value={form.defaultCapacity}
                  onChange={(e) =>
                    setForm({ ...form, defaultCapacity: e.target.value })
                  }
                  placeholder="Ex: 30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rt-color">Cor (hex)</Label>
                <div className="flex gap-2">
                  <Input
                    id="rt-color"
                    value={form.color}
                    onChange={(e) =>
                      setForm({ ...form, color: e.target.value })
                    }
                    placeholder="#3b82f6"
                  />
                  {form.color && (
                    <div
                      className="size-10 shrink-0 rounded border"
                      style={{ backgroundColor: form.color }}
                    />
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rt-icon">Ícone (emoji)</Label>
              <Input
                id="rt-icon"
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                placeholder="Ex: 🔬"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!form.name || isSaving}
              className="min-w-32"
            >
              {isSaving ? 'Salvando...' : editing ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o tipo{' '}
              <strong>{toDelete?.name}</strong>? Esta ação não pode ser
              desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="mr-2 size-4" />
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Resources Tab ────────────────────────────────────────────────────────────

const defaultResourceForm = { name: '', description: '', icon: '' }

function ResourcesTab({ isAdmin }: { isAdmin: boolean }) {
  const { api } = useAPI()
  const { data: raw = [] } = api.resources.listResources.useSuspenseQuery()
  const resources = (Array.isArray(raw) ? raw : []) as ResourceResponse[]

  const createMutation = api.resources.createResource.useMutation()
  const updateMutation = api.resources.updateResource.useMutation()
  const deleteMutation = api.resources.deleteResource.useMutation()
  const statusMutation = api.resources.updateResourceStatus.useMutation()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editing, setEditing] = useState<ResourceResponse | null>(null)
  const [form, setForm] = useState(defaultResourceForm)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [toDelete, setToDelete] = useState<ResourceResponse | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = useMemo(
    () =>
      resources.filter(
        (r) =>
          r.name?.toLowerCase().includes(search.toLowerCase()) ||
          r.description?.toLowerCase().includes(search.toLowerCase()),
      ),
    [resources, search],
  )

  function openCreate() {
    setEditing(null)
    setForm(defaultResourceForm)
    setIsFormOpen(true)
  }

  function openEdit(r: ResourceResponse) {
    setEditing(r)
    setForm({
      name: r.name ?? '',
      description: r.description ?? '',
      icon: r.icon ?? '',
    })
    setIsFormOpen(true)
  }

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      const body = {
        name: form.name,
        description: form.description || undefined,
        icon: form.icon || undefined,
      }
      if (editing?.id) {
        await updateMutation.mutateAsync({ path: { id: editing.id }, body })
        toast.success('Recurso atualizado com sucesso.')
      } else {
        await createMutation.mutateAsync({ body })
        toast.success('Recurso cadastrado com sucesso.')
      }
      await api.resources.listResources.invalidateQueries()
      setIsFormOpen(false)
    } catch {
      toast.error(
        editing ? 'Erro ao atualizar recurso.' : 'Erro ao cadastrar recurso.',
      )
    } finally {
      setTimeout(() => setIsSaving(false), 300)
    }
  }, [form, editing, createMutation, updateMutation, api])

  const handleDelete = useCallback(async () => {
    if (!toDelete?.id) return
    setIsDeleting(true)
    try {
      await deleteMutation.mutateAsync({ path: { id: toDelete.id } })
      await api.resources.listResources.invalidateQueries()
      toast.success('Recurso excluído com sucesso.')
      setIsDeleteOpen(false)
    } catch {
      toast.error('Erro ao excluir recurso.')
    } finally {
      setTimeout(() => setIsDeleting(false), 300)
    }
  }, [toDelete, deleteMutation, api])

  const handleToggleStatus = useCallback(
    async (r: ResourceResponse) => {
      try {
        const next = r.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
        await statusMutation.mutateAsync({
          path: { id: r.id! },
          body: { status: next },
        })
        await api.resources.listResources.invalidateQueries()
        toast.success(`Recurso ${next === 'INACTIVE' ? 'desativado' : 'ativado'} com sucesso.`)
      } catch {
        toast.error('Erro ao atualizar status.')
      }
    },
    [statusMutation, api],
  )

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar recurso..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {isAdmin && (
          <Button onClick={openCreate}>
            <Plus className="mr-2 size-4" />
            Novo Recurso
          </Button>
        )}
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ícone</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Status</TableHead>
              {isAdmin && <TableHead className="w-24">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={isAdmin ? 5 : 4}
                  className="py-8 text-center text-muted-foreground"
                >
                  Nenhum recurso encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-2xl">
                    {r.icon || <Archive className="size-5 text-muted-foreground" />}
                  </TableCell>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="max-w-48 truncate text-muted-foreground">
                    {r.description || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={r.status === 'ACTIVE' ? 'default' : 'secondary'}
                    >
                      {r.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(r)}>
                            <Pencil className="mr-2 size-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(r)}
                          >
                            {r.status === 'ACTIVE' ? (
                              <XCircle className="mr-2 size-4" />
                            ) : (
                              <CheckCircle2 className="mr-2 size-4" />
                            )}
                            {r.status === 'ACTIVE' ? 'Desativar' : 'Ativar'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setToDelete(r)
                              setIsDeleteOpen(true)
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 size-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Editar Recurso' : 'Novo Recurso'}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? 'Atualize as informações do recurso.'
                : 'Cadastre um novo recurso.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="r-name">Nome *</Label>
              <Input
                id="r-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Projetor"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="r-desc">Descrição</Label>
              <Input
                id="r-desc"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Descrição do recurso"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="r-icon">Ícone (emoji)</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="r-icon"
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  placeholder="Ex: 📽️"
                />
                {form.icon && (
                  <span className="text-3xl">{form.icon}</span>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!form.name || isSaving}
              className="min-w-32"
            >
              {isSaving ? 'Salvando...' : editing ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o recurso{' '}
              <strong>{toDelete?.name}</strong>? Esta ação não pode ser
              desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="mr-2 size-4" />
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
