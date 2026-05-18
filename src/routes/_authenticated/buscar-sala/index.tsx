import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import {
  Search,
  Calendar,
  Users,
  Building2,
  DoorOpen,
  ArrowRight,
  AlertCircle,
  Loader2,
  Check,
  X,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useAPI } from '@/hooks/use-api'
import { cn } from '@/lib/utils'
import type { components } from '@/api/schema'
import { RoomTypeIconsList } from '@/lib/room-type-icons'
import { LoadingAuthenticated } from '@/components/loading-authenticated'

type RoomDetailResponse = components['schemas']['RoomDetailResponse']
type RoomTypeResponse = components['schemas']['RoomTypeResponse']
type ResourceResponse = components['schemas']['ResourceResponse']

interface QueryParams {
  startAt: string
  endAt: string
  roomTypeId?: string
  resourceIds?: string[]
  minCapacity?: number
}

export const Route = createFileRoute('/_authenticated/buscar-sala/')({
  pendingComponent: LoadingAuthenticated,
  loader: async ({ context: { api } }) => {
    await Promise.all([
      api.roomTypes.listRoomTypes.prefetchQuery(),
      api.resources.listResources.prefetchQuery(),
    ])
  },
  component: BuscarSalaPage,
})

function toIso(localDatetime: string) {
  if (!localDatetime) return ''
  return localDatetime.length === 16 ? `${localDatetime}:00` : localDatetime
}

function BuscarSalaPage() {
  const { api } = useAPI()
  const navigate = useNavigate()

  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState('all')
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([])
  const [minCapacity, setMinCapacity] = useState('')
  const [queryParams, setQueryParams] = useState<QueryParams | null>(null)

  const { data: roomTypesRaw = [] } = api.roomTypes.listRoomTypes.useSuspenseQuery()
  const { data: resourcesRaw = [] } = api.resources.listResources.useSuspenseQuery()

  const roomTypes = (Array.isArray(roomTypesRaw) ? roomTypesRaw : []) as RoomTypeResponse[]
  const resources = (Array.isArray(resourcesRaw) ? resourcesRaw : []) as ResourceResponse[]

  const activeRoomTypes = roomTypes.filter((rt) => rt.status === 'ACTIVE')
  const activeResources = resources.filter((r) => r.status === 'ACTIVE')

  const {
    data: availableRoomsRaw = [],
    isLoading,
    isError,
    error,
  } = api.rooms.getAvailableRooms.useQuery(
    {
      query: queryParams
        ? {
            startAt: queryParams.startAt,
            endAt: queryParams.endAt,
            expand: ['building', 'roomType', 'resources'],
            ...(queryParams.roomTypeId && { roomTypeId: queryParams.roomTypeId }),
            ...(queryParams.resourceIds?.length && { resourceIds: queryParams.resourceIds }),
            ...(queryParams.minCapacity != null && { minCapacity: queryParams.minCapacity }),
          }
        : { startAt: '', endAt: '' },
    },
    { enabled: !!queryParams },
  )

  const availableRooms = (
    Array.isArray(availableRoomsRaw) ? availableRoomsRaw : []
  ) as RoomDetailResponse[]

  function handleSearch() {
    if (!startAt || !endAt) return
    setQueryParams({
      startAt: toIso(startAt),
      endAt: toIso(endAt),
      roomTypeId: selectedRoomTypeId !== 'all' ? selectedRoomTypeId : undefined,
      resourceIds: selectedResourceIds.length > 0 ? selectedResourceIds : undefined,
      minCapacity: minCapacity ? Number(minCapacity) : undefined,
    })
  }

  function handleClearFilters() {
    setSelectedRoomTypeId('all')
    setSelectedResourceIds([])
    setMinCapacity('')
  }

  function toggleResource(id: string) {
    setSelectedResourceIds((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id],
    )
  }

  const hasActiveFilters =
    selectedRoomTypeId !== 'all' || selectedResourceIds.length > 0 || minCapacity !== ''
  const hasSearched = queryParams !== null

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Search className="size-5 text-primary" />
        <h1 className="text-lg font-semibold">Buscar Sala</h1>
      </header>

      <main className="flex flex-1 flex-col overflow-auto p-6">
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-primary" />
              <CardTitle className="text-base">Período e Filtros</CardTitle>
            </div>
            <CardDescription>
              Informe o período desejado para ver as salas disponíveis para agendamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startAt">Início *</Label>
                <Input
                  id="startAt"
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endAt">Término *</Label>
                <Input
                  id="endAt"
                  type="datetime-local"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                  min={startAt}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Tipo de Sala</Label>
                <Select value={selectedRoomTypeId} onValueChange={setSelectedRoomTypeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    {activeRoomTypes.map((rt) => (
                      <SelectItem key={rt.id} value={rt.id!}>
                        {rt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="minCapacity">Capacidade Mínima</Label>
                <Input
                  id="minCapacity"
                  type="number"
                  min={0}
                  placeholder="Ex: 30"
                  value={minCapacity}
                  onChange={(e) => setMinCapacity(e.target.value)}
                />
              </div>
            </div>

            {activeResources.length > 0 && (
              <div className="space-y-2">
                <Label>Recursos Necessários</Label>
                <div className="flex flex-wrap gap-2">
                  {activeResources.map((resource) => {
                    const selected = selectedResourceIds.includes(resource.id!)
                    return (
                      <div
                        key={resource.id}
                        className={cn(
                          'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors select-none',
                          selected
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:bg-accent',
                        )}
                        onClick={() => toggleResource(resource.id!)}
                      >
                        <Checkbox checked={selected} className="pointer-events-none size-3.5" />
                        {resource.name}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <Button onClick={handleSearch} disabled={!startAt || !endAt} className="gap-2">
                <Search className="size-4" />
                Buscar Salas
              </Button>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  <X className="mr-1 size-4" />
                  Limpar filtros
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="mb-4 size-12 text-destructive" />
            <h3 className="text-lg font-medium">Erro ao buscar salas</h3>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : 'Tente novamente.'}
            </p>
          </div>
        )}

        {hasSearched && !isLoading && !isError && (
          <>
            <div className="mb-4">
              <h2 className="text-lg font-semibold">
                {availableRooms.length} sala{availableRooms.length !== 1 ? 's' : ''}{' '}
                disponív{availableRooms.length !== 1 ? 'eis' : 'el'}
              </h2>
            </div>

            {availableRooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <AlertCircle className="mb-4 size-12 text-muted-foreground" />
                <h3 className="text-lg font-medium">Nenhuma sala disponível</h3>
                <p className="text-sm text-muted-foreground">
                  Tente outro período ou ajuste os filtros.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {availableRooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    onReserve={() => navigate({ to: '/grade' })}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {!hasSearched && (
          <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
            <Search className="mb-4 size-14 opacity-20" />
            <p className="text-sm">
              Informe o período e clique em "Buscar Salas" para ver as salas disponíveis.
            </p>
          </div>
        )}
      </main>
    </>
  )
}

function RoomCard({
  room,
  onReserve,
}: {
  room: RoomDetailResponse
  onReserve: () => void
}) {
  const roomType = room.roomType
  const RoomTypeIcon = RoomTypeIconsList[roomType?.icon ?? '']?.icon ?? DoorOpen
  const roomTypeColor = roomType?.color ?? 'hsl(var(--primary))'

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: `color-mix(in srgb, ${roomTypeColor} 20%, transparent)` }}
          >
            <RoomTypeIcon className="size-5" style={{ color: roomTypeColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">{room.name}</CardTitle>
            <CardDescription className="text-xs">{room.code}</CardDescription>
          </div>
          <Badge className="shrink-0 gap-1 bg-emerald-500/20 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/30">
            <Check className="size-3" />
            Disponível
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          {roomType ? (
            <Badge
              variant="outline"
              style={{
                borderColor: `color-mix(in srgb, ${roomTypeColor} 50%, transparent)`,
                color: roomTypeColor,
                backgroundColor: `color-mix(in srgb, ${roomTypeColor} 15%, transparent)`,
              }}
            >
              {roomType.name}
            </Badge>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="size-4" />
            <span>{room.capacity ?? '—'} lugares</span>
          </div>
        </div>

        {room.building && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="size-4" />
            <span>
              {room.building.name}
              {room.floor != null ? ` — ${room.floor}º Andar` : ''}
            </span>
          </div>
        )}

        {room.resources && room.resources.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {room.resources.map((r) => (
              <Badge key={r.id} variant="secondary" className="text-xs">
                {r.name}
              </Badge>
            ))}
          </div>
        )}

        <Button size="sm" className="mt-2 w-full gap-1" onClick={onReserve}>
          Reservar
          <ArrowRight className="size-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
