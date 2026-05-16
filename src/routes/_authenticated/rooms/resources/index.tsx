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
  type LucideIcon,
  Projector,
  Wind,
  Monitor,
  Tv,
  Mic,
  Wifi,
  Package,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type ResourceResponse = components['schemas']['ResourceResponse']

export const Route = createFileRoute('/_authenticated/rooms/resources/')({
  component: ResourcesPage,
  loader: async ({ context: { api } }) => {
    await api.resources.listResources.prefetchQuery()
  },
  pendingComponent: LoadingAuthenticated,
})

const defaultForm = { name: '', description: '', icon: 'Projector' }

const ResourcesIconsList: Record<string, { label: string; icon: LucideIcon }> =
  {
    Projector: { label: 'Projetor', icon: Projector },
    Wind: { label: 'Ar-condicionado', icon: Wind },
    Monitor: { label: 'Monitor', icon: Monitor },
    Mic: { label: 'Microfone', icon: Mic },
    Tv: { label: 'TV', icon: Tv },
    Wifi: { label: 'Wi-Fi', icon: Wifi },
  }

function ResourcesPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const { api } = useAPI()

  const { data: raw = [] } = api.resources.listResources.useSuspenseQuery()
  const resources = (Array.isArray(raw) ? raw : []) as ResourceResponse[]

  const createMutation = api.resources.createResource.useMutation()
  const updateMutation = api.resources.updateResource.useMutation()
  const deleteMutation = api.resources.deleteResource.useMutation()
  const statusMutation = api.resources.updateResourceStatus.useMutation()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editing, setEditing] = useState<ResourceResponse | null>(null)
  const [form, setForm] = useState(defaultForm)
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
    setForm(defaultForm)
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
      toast.error(editing ? 'Erro ao atualizar recurso.' : 'Erro ao cadastrar recurso.')
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
        toast.success(
          `Recurso ${next === 'INACTIVE' ? 'desativado' : 'ativado'} com sucesso.`,
        )
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

      {/* List */}
      <div className="rounded-md border border-border overflow-hidden">
        {/* List header */}
        <div className="bg-muted/50 px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {filtered.length} recurso{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Items */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center bg-card">
            <Package className="mx-auto mb-4 size-12 text-muted-foreground/30" />
            <p className="text-muted-foreground font-medium">
              Nenhum recurso encontrado
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {search ? 'Tente ajustar os termos de busca' : 'Cadastre o primeiro recurso'}
            </p>
          </div>
        ) : (
          filtered.map((r, index) => {
            const IconEntry = r.icon ? ResourcesIconsList[r.icon] : null
            return (
              <div
                key={r.id}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 bg-card hover:bg-muted/30 transition-colors',
                  index !== filtered.length - 1 && 'border-b border-border',
                )}
              >
                {/* Icon */}
                <div className="shrink-0 text-muted-foreground">
                  {IconEntry ? (
                    <IconEntry.icon className="size-5 text-foreground" />
                  ) : (
                    <Archive className="size-5 text-muted-foreground" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground">{r.name}</span>
                    <Badge
                      variant={r.status === 'ACTIVE' ? 'default' : 'secondary'}
                      className="text-[10px] h-5"
                    >
                      {r.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  {r.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {r.description}
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
                        <DropdownMenuItem onClick={() => openEdit(r)}>
                          <Pencil className="mr-2 size-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(r)}>
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
            <DialogTitle>{editing ? 'Editar Recurso' : 'Novo Recurso'}</DialogTitle>
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
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descrição do recurso"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="r-icon">Ícone</Label>
              <Select
                value={form.icon}
                onValueChange={(e) => setForm({ ...form, icon: e })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um ícone" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ResourcesIconsList).map(([name, { label, icon }]) => {
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
              <strong>{toDelete?.name}</strong>? Esta ação não pode ser desfeita.
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
