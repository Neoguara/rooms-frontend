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
  Building2,
} from 'lucide-react'
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
import { Label } from '@/components/ui/label'
import { useAPI } from '@/hooks/use-api'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import type { components } from '@/api/schema'
import { LoadingAuthenticated } from '@/components/loading-authenticated'
import { toast } from 'sonner'

type BuildingResponse = components['schemas']['BuildingResponse']

export const Route = createFileRoute('/_authenticated/rooms/buildings/')({
  component: BuildingsPage,
  loader: async ({ context: { api } }) => {
    await api.buildings.listBuildings.prefetchQuery()
  },
  pendingComponent: LoadingAuthenticated,
})

const defaultForm = { name: '', address: '', totalFloors: '1' }

function BuildingsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const { api } = useAPI()

  const { data: raw = [] } = api.buildings.listBuildings.useSuspenseQuery()
  const buildings = (Array.isArray(raw) ? raw : []) as BuildingResponse[]

  const createMutation = api.buildings.createBuilding.useMutation()
  const updateMutation = api.buildings.updateBuilding.useMutation()
  const deleteMutation = api.buildings.deleteBuilding.useMutation()
  const statusMutation = api.buildings.updateBuildingStatus.useMutation()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editing, setEditing] = useState<BuildingResponse | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [toDelete, setToDelete] = useState<BuildingResponse | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const stats = useMemo(
    () => ({
      active: buildings.filter((b) => b.status === 'ACTIVE').length,
      inactive: buildings.filter((b) => b.status === 'INACTIVE').length,
    }),
    [buildings],
  )

  const filtered = useMemo(
    () =>
      buildings.filter((b) => {
        const matchesSearch =
          b.name?.toLowerCase().includes(search.toLowerCase()) ||
          b.address?.toLowerCase().includes(search.toLowerCase())
        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'active' && b.status === 'ACTIVE') ||
          (statusFilter === 'inactive' && b.status === 'INACTIVE')
        return matchesSearch && matchesStatus
      }),
    [buildings, search, statusFilter],
  )

  function openCreate() {
    setEditing(null)
    setForm(defaultForm)
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
        address: form.address || undefined,
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
      try {
        const next = b.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
        await statusMutation.mutateAsync({
          path: { id: b.id! },
          body: { status: next },
        })
        await api.buildings.listBuildings.invalidateQueries()
        toast.success(`Prédio ${next === 'INACTIVE' ? 'desativado' : 'ativado'} com sucesso.`)
      } catch {
        toast.error('Erro ao atualizar status.')
      }
    },
    [statusMutation, api],
  )

  return (
    <>
      {/* Toolbar */}
      <div className="mb-4 flex items-center gap-3">
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
              onClick={() => setStatusFilter(statusFilter === 'active' ? 'all' : 'active')}
            >
              <CheckCircle2 className="size-4 text-emerald-500" />
              {stats.active} Ativos
            </button>
            <button
              className={cn(
                'flex items-center gap-1.5',
                statusFilter === 'inactive' ? 'text-foreground font-medium' : 'text-muted-foreground',
              )}
              onClick={() => setStatusFilter(statusFilter === 'inactive' ? 'all' : 'inactive')}
            >
              <XCircle className="size-4 text-red-500" />
              {stats.inactive} Inativos
            </button>
          </div>
          <span className="text-sm text-muted-foreground">
            {filtered.length} prédio{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Items */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center bg-card">
            <Building2 className="mx-auto mb-4 size-12 text-muted-foreground/30" />
            <p className="text-muted-foreground font-medium">Nenhum prédio encontrado</p>
            <p className="text-sm text-muted-foreground mt-1">
              {search ? 'Tente ajustar os termos de busca' : 'Cadastre o primeiro prédio'}
            </p>
          </div>
        ) : (
          filtered.map((b, index) => (
            <div
              key={b.id}
              className={cn(
                'flex items-center gap-3 px-4 py-3 bg-card hover:bg-muted/30 transition-colors',
                index !== filtered.length - 1 && 'border-b border-border',
              )}
            >
              {/* Icon */}
              <div className="shrink-0 text-muted-foreground">
                <Building2 className="size-5 text-foreground" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground">{b.name}</span>
                  <Badge
                    variant={b.status === 'ACTIVE' ? 'default' : 'secondary'}
                    className="text-[10px] h-5"
                  >
                    {b.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                  </Badge>
                  {b.totalFloors && (
                    <span className="text-xs text-muted-foreground">
                      {b.totalFloors} andares
                    </span>
                  )}
                </div>
                {b.address && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {b.address}
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
                      <DropdownMenuItem onClick={() => openEdit(b)}>
                        <Pencil className="mr-2 size-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleStatus(b)}>
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
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Prédio' : 'Novo Prédio'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Atualize as informações do prédio.' : 'Cadastre um novo prédio.'}
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
                onChange={(e) => setForm({ ...form, totalFloors: e.target.value })}
                min={1}
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
              Tem certeza que deseja excluir o prédio{' '}
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
