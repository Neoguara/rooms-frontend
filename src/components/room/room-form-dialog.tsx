import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { Monitor, Wind, Wifi, Projector, Mic, Tv } from 'lucide-react'
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

type RoomResponse = components['schemas']['RoomResponse']

const allResources = [
  { id: 'projetor', label: 'Projetor', icon: Projector },
  { id: 'ar_condicionado', label: 'Ar Condicionado', icon: Wind },
  { id: 'quadro_branco', label: 'Quadro Branco', icon: Monitor },
  { id: 'computadores', label: 'Computadores', icon: Monitor },
  { id: 'sistema_som', label: 'Sistema de Som', icon: Mic },
  { id: 'microfones', label: 'Microfones', icon: Mic },
  { id: 'tv', label: 'TV', icon: Tv },
  { id: 'videoconferencia', label: 'Videoconferência', icon: Monitor },
  { id: 'wifi', label: 'Wi-Fi', icon: Wifi },
]

const roomTypes = [
  { value: 'sala_aula', label: 'Sala de Aula' },
  { value: 'laboratorio', label: 'Laboratório' },
  { value: 'auditorio', label: 'Auditório' },
  { value: 'sala_reuniao', label: 'Sala de Reunião' },
]

const buildings = ['Bloco A', 'Bloco B', 'Bloco C', 'Bloco D', 'Bloco E', 'Bloco F']

const floors = [
  { value: '0', label: 'Térreo' },
  { value: '1', label: '1º Andar' },
  { value: '2', label: '2º Andar' },
  { value: '3', label: '3º Andar' },
  { value: '4', label: '4º Andar' },
  { value: '5', label: '5º Andar' },
]

interface FormData {
  name: string
  code: string
  type: string
  building: string
  floor: string
  capacity: string
  resources: string[]
}

const defaultForm: FormData = {
  name: '',
  code: '',
  type: 'sala_aula',
  building: 'Bloco A',
  floor: '1',
  capacity: '30',
  resources: [],
}

function parseResources(resources?: string): string[] {
  if (!resources) return []
  try {
    const parsed = JSON.parse(resources)
    return Array.isArray(parsed) ? parsed : [resources]
  } catch {
    return resources.split(',').map((r) => r.trim()).filter(Boolean)
  }
}

interface RoomFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingRoom: RoomResponse | null
}

export const RoomFormDialog = memo(function RoomFormDialog({
  open,
  onOpenChange,
  editingRoom,
}: RoomFormDialogProps) {
  const { api } = useAPI()

  const createMutation = api.rooms.create1.useMutation()
  const updateMutation = api.rooms.update1.useMutation()
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
              type: editingRoom.type ?? 'sala_aula',
              building: editingRoom.building ?? 'Bloco A',
              floor: String(editingRoom.floor ?? 1),
              capacity: String(editingRoom.capacity ?? 30),
              resources: parseResources(editingRoom.resources),
            }
          : defaultForm,
      )
    }
    wasOpen.current = open
  }, [open, editingRoom])

  const toggleResource = (label: string) => {
    setForm((prev) => ({
      ...prev,
      resources: prev.resources.includes(label)
        ? prev.resources.filter((r) => r !== label)
        : [...prev.resources, label],
    }))
  }

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      const body = {
        name: form.name,
        code: form.code,
        type: form.type,
        building: form.building,
        floor: parseInt(form.floor),
        capacity: parseInt(form.capacity),
        resources: JSON.stringify(form.resources),
      }
      if (editingRoom?.id) {
        await updateMutation.mutateAsync({ path: { id: editingRoom.id }, body })
        await api.rooms.findAll1.invalidateQueries()
        toast.success('Sala atualizada com sucesso.')
      } else {
        await createMutation.mutateAsync({ body })
        await api.rooms.findAll1.invalidateQueries()
        toast.success('Sala cadastrada com sucesso.')
      }
      onOpenChange(false)
    } catch (e) {
      console.error(e)
      toast.error(editingRoom?.id ? 'Erro ao atualizar sala.' : 'Erro ao cadastrar sala.')
    } finally {
      setTimeout(() => setIsSaving(false), 300)
    }
  }, [form, editingRoom, createMutation, updateMutation, api, onOpenChange])

  const isDisabled = !form.name || !form.code || !form.capacity || isSaving

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
              <Label htmlFor="name">Nome da Sala *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Sala 101"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Código *</Label>
              <Input
                id="code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="Ex: BL-A-101"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roomTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacidade *</Label>
              <Input
                id="capacity"
                type="number"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                min={1}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prédio *</Label>
              <Select value={form.building} onValueChange={(v) => setForm({ ...form, building: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {buildings.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Andar *</Label>
              <Select value={form.floor} onValueChange={(v) => setForm({ ...form, floor: v })}>
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
            <div className="grid grid-cols-2 gap-3">
              {allResources.map((resource) => (
                <div key={resource.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={resource.id}
                    checked={form.resources.includes(resource.label)}
                    onCheckedChange={() => toggleResource(resource.label)}
                  />
                  <label
                    htmlFor={resource.id}
                    className="text-sm font-medium leading-none flex items-center gap-2 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    <resource.icon className="size-4 text-muted-foreground" />
                    {resource.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isDisabled} className="min-w-40">
            {isSaving ? 'Salvando...' : editingRoom ? 'Salvar Alterações' : 'Criar Sala'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})
