import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useMemo, useState } from 'react'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Archive,
  ArchiveRestore,
  Tag,
} from 'lucide-react'
import { RoomTypeIconsList } from '@/lib/room-type-icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { Label } from '@/components/ui/label'
import { useAPI } from '@/hooks/use-api'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import type { components } from '@/api/schema'
import { LoadingAuthenticated } from '@/components/loading-authenticated'
import { toast } from 'sonner'

type RoomTypeResponse = components['schemas']['RoomTypeResponse']
type UpdateableStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'

export const Route = createFileRoute('/_authenticated/rooms/room-types/')({
  component: RoomTypesPage,
  loader: async ({ context: { api } }) => {
    await api.roomTypes.listRoomTypes.prefetchQuery()
  },
  pendingComponent: LoadingAuthenticated,
})

const defaultForm = {
  name: '',
  description: '',
  defaultCapacity: '',
  color: '',
  icon: 'BookOpen',
}

function StatusBadge({ status }: { status?: RoomTypeResponse['status'] }) {
  if (status === 'ACTIVE')
    return (
      <Badge variant="default" className="text-[10px] h-5">
        Ativo
      </Badge>
    )
  if (status === 'ARCHIVED')
    return (
      <Badge variant="outline" className="text-[10px] h-5 text-amber-600 border-amber-400">
        Arquivado
      </Badge>
    )
  return (
    <Badge variant="secondary" className="text-[10px] h-5">
      Inativo
    </Badge>
  )
}

function RoomTypesPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const { api } = useAPI()

  const { data: raw = [] } = api.roomTypes.listRoomTypes.useSuspenseQuery()
  const roomTypes = (Array.isArray(raw) ? raw : []) as RoomTypeResponse[]

  const createMutation = api.roomTypes.createRoomType.useMutation()
  const updateMutation = api.roomTypes.updateRoomType.useMutation()
  const deleteMutation = api.roomTypes.deleteRoomType.useMutation()
  const statusMutation = api.roomTypes.updateRoomTypeStatus.useMutation()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editing, setEditing] = useState<RoomTypeResponse | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [toDelete, setToDelete] = useState<RoomTypeResponse | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const stats = useMemo(
    () => ({
      active: roomTypes.filter((rt) => rt.status === 'ACTIVE').length,
      inactive: roomTypes.filter((rt) => rt.status === 'INACTIVE').length,
      archived: roomTypes.filter((rt) => rt.status === 'ARCHIVED').length,
    }),
    [roomTypes],
  )

  const filtered = useMemo(
    () =>
      roomTypes.filter((rt) => {
        if (rt.status === 'DELETED') return false
        const matchesSearch =
          rt.name?.toLowerCase().includes(search.toLowerCase()) ||
          rt.description?.toLowerCase().includes(search.toLowerCase())
        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'active' && rt.status === 'ACTIVE') ||
          (statusFilter === 'inactive' && rt.status === 'INACTIVE') ||
          (statusFilter === 'archived' && rt.status === 'ARCHIVED')
        return matchesSearch && matchesStatus
      }),
    [roomTypes, search, statusFilter],
  )

  function openCreate() {
    setEditing(null)
    setForm(defaultForm)
    setIsFormOpen(true)
  }

  function openEdit(rt: RoomTypeResponse) {
    setEditing(rt)
    setForm({
      name: rt.name ?? '',
      description: rt.description ?? '',
      defaultCapacity: rt.defaultCapacity ?? '',
      color: rt.color ?? '',
      icon: rt.icon ?? 'BookOpen',
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
      toast.error(editing ? 'Erro ao atualizar tipo.' : 'Erro ao cadastrar tipo.')
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

  const handleStatusChange = useCallback(
    async (rt: RoomTypeResponse, next: UpdateableStatus) => {
      try {
        await statusMutation.mutateAsync({
          path: { id: rt.id! },
          body: { status: next },
        })
        await api.roomTypes.listRoomTypes.invalidateQueries()
        const labels: Record<UpdateableStatus, string> = {
          ACTIVE: 'ativado',
          INACTIVE: 'desativado',
          ARCHIVED: 'arquivado',
        }
        toast.success(`Tipo de sala ${labels[next]} com sucesso.`)
      } catch {
        toast.error('Erro ao atualizar status.')
      }
    },
    [statusMutation, api],
  )

  function toggleStatusFilter(value: string) {
    setStatusFilter((prev) => (prev === value ? 'all' : value))
  }

  return (
    <>
      {/* Toolbar */}
      <div className="mb-4 flex items-center gap-3">
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

      {/* List */}
      <div className="rounded-md border border-border overflow-hidden">
        {/* List header */}
        <div className="bg-muted/50 px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm">
            <button
              className={cn(
                'flex items-center gap-1.5 font-medium',
                statusFilter === 'active' ? 'text-foreground' : 'text-muted-foreground',
              )}
              onClick={() => toggleStatusFilter('active')}
            >
              <CheckCircle2 className="size-4 text-emerald-500" />
              {stats.active} Ativos
            </button>
            <button
              className={cn(
                'flex items-center gap-1.5',
                statusFilter === 'inactive' ? 'text-foreground font-medium' : 'text-muted-foreground',
              )}
              onClick={() => toggleStatusFilter('inactive')}
            >
              <XCircle className="size-4 text-red-500" />
              {stats.inactive} Inativos
            </button>
            <button
              className={cn(
                'flex items-center gap-1.5',
                statusFilter === 'archived' ? 'text-foreground font-medium' : 'text-muted-foreground',
              )}
              onClick={() => toggleStatusFilter('archived')}
            >
              <Archive className="size-4 text-amber-500" />
              {stats.archived} Arquivados
            </button>
          </div>
          <span className="text-sm text-muted-foreground">
            {filtered.length} tipo{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Items */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center bg-card">
            <Tag className="mx-auto mb-4 size-12 text-muted-foreground/30" />
            <p className="text-muted-foreground font-medium">Nenhum tipo de sala encontrado</p>
            <p className="text-sm text-muted-foreground mt-1">
              {search ? 'Tente ajustar os termos de busca' : 'Cadastre o primeiro tipo de sala'}
            </p>
          </div>
        ) : (
          filtered.map((rt, index) => {
            const IconEntry = rt.icon ? RoomTypeIconsList[rt.icon] : null
            const isArchived = rt.status === 'ARCHIVED'
            return (
              <div
                key={rt.id}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 bg-card hover:bg-muted/30 transition-colors',
                  index !== filtered.length - 1 && 'border-b border-border',
                  isArchived && 'opacity-60',
                )}
              >
                {/* Icon */}
                <div className="shrink-0 text-muted-foreground">
                  {IconEntry ? (
                    <IconEntry.icon className="size-5 text-foreground" />
                  ) : (
                    <Tag className="size-5 text-muted-foreground" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {rt.color && (
                      <span
                        className="inline-block size-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: rt.color }}
                      />
                    )}
                    <span className="font-semibold text-foreground">{rt.name}</span>
                    <StatusBadge status={rt.status} />
                    {rt.defaultCapacity && (
                      <span className="text-xs text-muted-foreground">
                        Cap. {rt.defaultCapacity}
                      </span>
                    )}
                  </div>
                  {rt.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {rt.description}
                    </p>
                  )}
                </div>

                {/* Actions */}
                {isAdmin && (
                  <div className="shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!isArchived && (
                          <DropdownMenuItem onClick={() => openEdit(rt)}>
                            <Pencil className="mr-2 size-4" />
                            Editar
                          </DropdownMenuItem>
                        )}

                        {rt.status === 'ACTIVE' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(rt, 'INACTIVE')}>
                            <XCircle className="mr-2 size-4" />
                            Desativar
                          </DropdownMenuItem>
                        )}

                        {rt.status === 'INACTIVE' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(rt, 'ACTIVE')}>
                            <CheckCircle2 className="mr-2 size-4" />
                            Ativar
                          </DropdownMenuItem>
                        )}

                        {!isArchived && (
                          <DropdownMenuItem onClick={() => handleStatusChange(rt, 'ARCHIVED')}>
                            <Archive className="mr-2 size-4" />
                            Arquivar
                          </DropdownMenuItem>
                        )}

                        {isArchived && (
                          <DropdownMenuItem onClick={() => handleStatusChange(rt, 'ACTIVE')}>
                            <ArchiveRestore className="mr-2 size-4" />
                            Restaurar
                          </DropdownMenuItem>
                        )}

                        {isArchived && (
                          <>
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
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Tipo de Sala' : 'Novo Tipo de Sala'}</DialogTitle>
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
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descrição do tipo de sala"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rt-cap">Capacidade Padrão</Label>
                <Input
                  id="rt-cap"
                  value={form.defaultCapacity}
                  onChange={(e) => setForm({ ...form, defaultCapacity: e.target.value })}
                  placeholder="Ex: 30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rt-color">Cor (hex)</Label>
                <div className="flex gap-2">
                  <Input
                    id="rt-color"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
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
              <Label htmlFor="rt-icon">Ícone</Label>
              <Select
                value={form.icon}
                onValueChange={(value) => setForm({ ...form, icon: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um ícone" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RoomTypeIconsList).map(([name, { label, icon }]) => {
                    const Icon = icon
                    return (
                      <SelectItem key={name} value={name}>
                        <Icon className="mr-2 inline size-4" /> {label}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!form.name || isSaving} className="min-w-32">
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
              Tem certeza que deseja excluir permanentemente o tipo{' '}
              <strong>{toDelete?.name}</strong>? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              <Trash2 className="mr-2 size-4" />
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
