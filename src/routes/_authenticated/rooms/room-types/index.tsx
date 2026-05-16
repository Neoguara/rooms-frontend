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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
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
import type { components } from '@/api/schema'
import { LoadingAuthenticated } from '@/components/loading-authenticated'
import { toast } from 'sonner'

type RoomTypeResponse = components['schemas']['RoomTypeResponse']

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
  icon: '',
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

  const handleToggleStatus = useCallback(
    async (rt: RoomTypeResponse) => {
      try {
        const next = rt.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
        await statusMutation.mutateAsync({
          path: { id: rt.id! },
          body: { status: next },
        })
        await api.roomTypes.listRoomTypes.invalidateQueries()
        toast.success(`Tipo ${next === 'INACTIVE' ? 'desativado' : 'ativado'} com sucesso.`)
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
                  <TableCell className="text-xl">{rt.icon || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={rt.status === 'ACTIVE' ? 'default' : 'secondary'}>
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
                          <DropdownMenuItem onClick={() => handleToggleStatus(rt)}>
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
              Tem certeza que deseja excluir o tipo{' '}
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
