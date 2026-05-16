import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { components } from '@/api/schema'
import { useAPI } from '@/hooks/use-api'
import { toast } from 'sonner'
import { ResourcesIconsList } from '@/lib/resources-icons'
import { RoomTypeIconsList } from '@/lib/room-type-icons'

type RoomDetailResponse = components['schemas']['RoomDetailResponse']
type BuildingResponse = components['schemas']['BuildingResponse']
type RoomTypeResponse = components['schemas']['RoomTypeResponse']
type ResourceResponse = components['schemas']['ResourceResponse']

const floors = [
  { value: '0', label: 'Térreo' },
  { value: '1', label: '1º Andar' },
  { value: '2', label: '2º Andar' },
  { value: '3', label: '3º Andar' },
  { value: '4', label: '4º Andar' },
  { value: '5', label: '5º Andar' },
  { value: '6', label: '6º Andar' },
  { value: '7', label: '7º Andar' },
  { value: '8', label: '8º Andar' },
]

interface FormData {
  name: string
  code: string
  roomTypeId: string
  buildingId: string
  floor: string
  capacity: string
  resourceIds: string[]
}

const defaultForm: FormData = {
  name: '',
  code: '',
  roomTypeId: '',
  buildingId: '',
  floor: '1',
  capacity: '30',
  resourceIds: [],
}

interface RoomFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingRoom: RoomDetailResponse | null
}

export const RoomFormDialog = memo(function RoomFormDialog({
  open,
  onOpenChange,
  editingRoom,
}: RoomFormDialogProps) {
  const { api } = useAPI()

  const { data: buildingsRaw = [] } = api.buildings.listBuildings.useQuery()
  const { data: roomTypesRaw = [] } = api.roomTypes.listRoomTypes.useQuery()
  const { data: resourcesRaw = [] } = api.resources.listResources.useQuery()

  const buildings = (Array.isArray(buildingsRaw) ? buildingsRaw : []) as BuildingResponse[]
  const roomTypes = (Array.isArray(roomTypesRaw) ? roomTypesRaw : []) as RoomTypeResponse[]
  const resources = (Array.isArray(resourcesRaw) ? resourcesRaw : []) as ResourceResponse[]

  const createMutation = api.rooms.createRoom.useMutation()
  const updateMutation = api.rooms.updateRoom.useMutation()
  const replaceResourcesMutation = api.rooms.replaceRoomResources.useMutation()

  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState<FormData>(defaultForm)

  const wasOpen = useRef(false)
  useEffect(() => {
    if (open && !wasOpen.current) {
      setForm(
        editingRoom
          ? {
              name: editingRoom.name ?? '',
              code: editingRoom.code ?? '',
              roomTypeId: editingRoom.roomTypeId ?? '',
              buildingId: editingRoom.buildingId ?? '',
              floor: String(editingRoom.floor ?? 1),
              capacity: String(editingRoom.capacity ?? 30),
              resourceIds:
                (editingRoom.resources
                  ?.map((r) => r.id)
                  .filter(Boolean) as string[]) ?? [],
            }
          : defaultForm,
      )
    }
    wasOpen.current = open
  }, [open, editingRoom])

  const toggleResource = (id: string) => {
    setForm((prev) => ({
      ...prev,
      resourceIds: prev.resourceIds.includes(id)
        ? prev.resourceIds.filter((r) => r !== id)
        : [...prev.resourceIds, id],
    }))
  }

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      if (editingRoom?.id) {
        await updateMutation.mutateAsync({
          path: { id: editingRoom.id },
          body: {
            name: form.name,
            code: form.code,
            roomTypeId: form.roomTypeId || undefined,
            buildingId: form.buildingId || undefined,
            floor: parseInt(form.floor),
            capacity: parseInt(form.capacity),
          },
        })
        await replaceResourcesMutation.mutateAsync({
          path: { id: editingRoom.id },
          body: { resourceIds: form.resourceIds },
        })
        await api.rooms.listRooms.invalidateQueries()
        toast.success('Sala atualizada com sucesso.')
      } else {
        await createMutation.mutateAsync({
          body: {
            name: form.name,
            code: form.code,
            roomTypeId: form.roomTypeId || undefined,
            buildingId: form.buildingId || undefined,
            floor: parseInt(form.floor),
            capacity: parseInt(form.capacity),
            resourceIds: form.resourceIds,
          },
        })
        await api.rooms.listRooms.invalidateQueries()
        toast.success('Sala cadastrada com sucesso.')
      }
      onOpenChange(false)
    } catch (e) {
      console.error(e)
      toast.error(
        editingRoom?.id ? 'Erro ao atualizar sala.' : 'Erro ao cadastrar sala.',
      )
    } finally {
      setTimeout(() => setIsSaving(false), 300)
    }
  }, [
    form,
    editingRoom,
    createMutation,
    updateMutation,
    replaceResourcesMutation,
    api,
    onOpenChange,
  ])

  const isDisabled = !form.name || !form.code || !form.capacity || isSaving

  const activeBuildings = buildings.filter(
    (b) => b.status !== 'INACTIVE' && b.status !== 'ARCHIVED',
  )
  const activeRoomTypes = roomTypes.filter((rt) => rt.status !== 'INACTIVE' && rt.status !== 'DELETED')
  const activeResources = resources.filter((r) => r.status !== 'INACTIVE' && r.status !== 'DELETED')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingRoom ? 'Editar Sala' : 'Nova Sala'}</DialogTitle>
          <DialogDescription>
            {editingRoom
              ? 'Atualize as informações da sala.'
              : 'Preencha os dados para cadastrar uma nova sala.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="room-name">Nome da Sala *</Label>
              <Input
                id="room-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Sala 101"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="room-code">Código *</Label>
              <Input
                id="room-code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="Ex: BL-A-101"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Sala</Label>
              <Select
                value={form.roomTypeId}
                onValueChange={(v) => setForm({ ...form, roomTypeId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {activeRoomTypes.map((rt) => {
                    const RoomTypeIcon = RoomTypeIconsList[rt.icon ?? '']?.icon
                    return (
                      <SelectItem key={rt.id} value={rt.id!}>
                        <span className="flex items-center gap-2">
                          {RoomTypeIcon && <RoomTypeIcon className="size-4" />}
                          {rt.name}
                        </span>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="room-capacity">Capacidade *</Label>
              <Input
                id="room-capacity"
                type="number"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                min={1}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prédio</Label>
              <Select
                value={form.buildingId}
                onValueChange={(v) => setForm({ ...form, buildingId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o prédio" />
                </SelectTrigger>
                <SelectContent>
                  {activeBuildings.map((b) => (
                    <SelectItem key={b.id} value={b.id!}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Andar</Label>
              <Select
                value={form.floor}
                onValueChange={(v) => setForm({ ...form, floor: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {floors.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Recursos Disponíveis</Label>
            {activeResources.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum recurso cadastrado.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {activeResources.map((resource) => (
                  <div key={resource.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`res-${resource.id}`}
                      checked={form.resourceIds.includes(resource.id!)}
                      onCheckedChange={() => toggleResource(resource.id!)}
                    />
                    <label
                      htmlFor={`res-${resource.id}`}
                      className="flex cursor-pointer items-center gap-2 text-sm font-medium leading-none"
                    >
                      {(() => {
                        const ResourceIcon = ResourcesIconsList[resource.icon ?? '']?.icon
                        return ResourceIcon ? <ResourceIcon className="size-4" /> : null
                      })()}
                      {resource.name}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isDisabled}
            className="min-w-40"
          >
            {isSaving
              ? 'Salvando...'
              : editingRoom
                ? 'Salvar Alterações'
                : 'Criar Sala'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})
