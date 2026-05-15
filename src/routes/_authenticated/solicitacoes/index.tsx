import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import {
  CheckCircle,
  XCircle,
  Circle,
  Calendar,
  Clock,
  FileText,
  Plus,
  Edit,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  GitPullRequest,
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useAPI } from '@/hooks/use-api'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import type { components } from '@/api/schema'
import { LoadingAuthenticated } from '@/components/loading-authenticated'
import { toast } from 'sonner'

type EventRequestResponse = components['schemas']['EventRequestResponse']

export const Route = createFileRoute('/_authenticated/solicitacoes/')({
  component: SolicitacoesPage,
  loader: async ({ context: { api } }) => {
    await api.eventRequests.listEventRequests.prefetchQuery()
  },
  pendingComponent: LoadingAuthenticated,
})

function normalizeStatus(status?: string) {
  return status?.toUpperCase() ?? ''
}

function normalizeType(type?: string) {
  return type?.toUpperCase() ?? ''
}

function getTypeName(type?: string) {
  switch (normalizeType(type)) {
    case 'CREATE': return 'Nova Reserva'
    case 'UPDATE': return 'Alteração'
    case 'DELETE': return 'Cancelamento'
    default: return type ?? 'Desconhecido'
  }
}

function getTypeColor(type?: string) {
  switch (normalizeType(type)) {
    case 'CREATE': return 'border-emerald-500/50 text-emerald-600 bg-emerald-500/10'
    case 'UPDATE': return 'border-blue-500/50 text-blue-600 bg-blue-500/10'
    case 'DELETE': return 'border-red-500/50 text-red-600 bg-red-500/10'
    default: return 'border-gray-500/50 text-gray-600 bg-gray-500/10'
  }
}

function getTypeIcon(type?: string) {
  switch (normalizeType(type)) {
    case 'CREATE': return <Plus className="size-4" />
    case 'UPDATE': return <Edit className="size-4" />
    case 'DELETE': return <Trash2 className="size-4" />
    default: return <FileText className="size-4" />
  }
}

function getRequestTitle(r: EventRequestResponse) {
  return (
    r.changeItem?.newTitle ??
    r.changeItem?.oldTitle ??
    `Solicitação #${r.id?.slice(0, 8) ?? '?'}`
  )
}

function isPending(r: EventRequestResponse) {
  return normalizeStatus(r.status) === 'PENDING'
}

function isApproved(r: EventRequestResponse) {
  return normalizeStatus(r.status) === 'APPROVED'
}

function isRejected(r: EventRequestResponse) {
  return normalizeStatus(r.status) === 'REJECTED'
}

function SolicitacoesPage() {
  const { api } = useAPI()
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const { data: rawData = [] } = api.eventRequests.listEventRequests.useSuspenseQuery()
  const requests = Array.isArray(rawData)
    ? (rawData as EventRequestResponse[])
    : []

  const approveMutation = api.eventRequests.approveEventRequest.useMutation()
  const rejectMutation = api.eventRequests.rejectEventRequest.useMutation()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [approveTarget, setApproveTarget] =
    useState<EventRequestResponse | null>(null)
  const [rejectTarget, setRejectTarget] =
    useState<EventRequestResponse | null>(null)

  const stats = useMemo(
    () => ({
      total: requests.length,
      pendente: requests.filter(isPending).length,
      aprovada: requests.filter(isApproved).length,
      rejeitada: requests.filter(isRejected).length,
    }),
    [requests],
  )

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      const q = search.toLowerCase()
      const matchesSearch =
        q === '' ||
        r.type?.toLowerCase().includes(q) ||
        r.justification?.toLowerCase().includes(q) ||
        r.changeItem?.newTitle?.toLowerCase().includes(q) ||
        r.changeItem?.oldTitle?.toLowerCase().includes(q)

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'pendente' && isPending(r)) ||
        (statusFilter === 'aprovada' && isApproved(r)) ||
        (statusFilter === 'rejeitada' && isRejected(r))

      return matchesSearch && matchesStatus
    })
  }, [requests, search, statusFilter])

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )

  function resetPage() {
    setCurrentPage(1)
  }

  async function handleApprove(r: EventRequestResponse) {
    if (!r.id) return
    try {
      await approveMutation.mutateAsync({ path: { id: r.id } })
      await api.eventRequests.listEventRequests.invalidateQueries()
      toast.success('Solicitação aprovada com sucesso.')
    } catch {
      toast.error('Erro ao aprovar solicitação.')
    } finally {
      setApproveTarget(null)
    }
  }

  async function handleReject(r: EventRequestResponse) {
    if (!r.id) return
    try {
      await rejectMutation.mutateAsync({ path: { id: r.id } })
      await api.eventRequests.listEventRequests.invalidateQueries()
      toast.success('Solicitação rejeitada.')
    } catch {
      toast.error('Erro ao rejeitar solicitação.')
    } finally {
      setRejectTarget(null)
    }
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center border-b border-border px-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <GitPullRequest className="size-5 text-primary" />
          <h1 className="text-lg font-semibold">Solicitações</h1>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6">
        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">solicitações</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-500">
                {stats.pendente}
              </div>
              <p className="text-xs text-muted-foreground">aguardando análise</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Aprovadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-500">
                {stats.aprovada}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.rejeitada} rejeitadas
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Taxa de Aprovação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-500">
                {stats.total > 0
                  ? Math.round((stats.aprovada / stats.total) * 100)
                  : 0}
                %
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.aprovada} de {stats.total}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar solicitações..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                resetPage()
              }}
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v)
              resetPage()
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="aprovada">Aprovada</SelectItem>
              <SelectItem value="rejeitada">Rejeitada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* List */}
        <div className="rounded-md border border-border overflow-hidden">
          {/* List header */}
          <div className="bg-muted/50 px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <button
                className={cn(
                  'flex items-center gap-1.5 font-medium',
                  statusFilter === 'pendente'
                    ? 'text-foreground'
                    : 'text-muted-foreground',
                )}
                onClick={() =>
                  setStatusFilter(
                    statusFilter === 'pendente' ? 'all' : 'pendente',
                  )
                }
              >
                <Circle className="size-4 fill-amber-500 text-amber-500" />
                {stats.pendente} Pendentes
              </button>
              <button
                className={cn(
                  'flex items-center gap-1.5',
                  statusFilter === 'aprovada'
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground',
                )}
                onClick={() =>
                  setStatusFilter(
                    statusFilter === 'aprovada' ? 'all' : 'aprovada',
                  )
                }
              >
                <CheckCircle className="size-4 text-emerald-500" />
                {stats.aprovada} Aprovadas
              </button>
              <button
                className={cn(
                  'flex items-center gap-1.5',
                  statusFilter === 'rejeitada'
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground',
                )}
                onClick={() =>
                  setStatusFilter(
                    statusFilter === 'rejeitada' ? 'all' : 'rejeitada',
                  )
                }
              >
                <XCircle className="size-4 text-red-500" />
                {stats.rejeitada} Rejeitadas
              </button>
            </div>
            <span className="text-sm text-muted-foreground">
              {filtered.length} solicitação(ões)
            </span>
          </div>

          {/* Items */}
          {filtered.length === 0 ? (
            <div className="py-16 text-center bg-card">
              <GitPullRequest className="mx-auto mb-4 size-12 text-muted-foreground/30" />
              <p className="text-muted-foreground font-medium">
                Nenhuma solicitação encontrada
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Tente ajustar os filtros de busca
              </p>
            </div>
          ) : (
            paginated.map((request, index) => (
              <div
                key={request.id}
                className={cn(
                  'flex items-start gap-3 px-4 py-3 bg-card hover:bg-muted/30 transition-colors',
                  index !== paginated.length - 1 && 'border-b border-border',
                )}
              >
                {/* Status icon */}
                <div className="mt-0.5 shrink-0">
                  {isApproved(request) ? (
                    <CheckCircle className="size-5 text-emerald-500" />
                  ) : isRejected(request) ? (
                    <XCircle className="size-5 text-red-500" />
                  ) : (
                    <Circle className="size-5 fill-amber-500 text-amber-500" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground">
                          {getRequestTitle(request)}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] h-5 flex items-center gap-1',
                            getTypeColor(request.type),
                          )}
                        >
                          {getTypeIcon(request.type)}
                          {getTypeName(request.type)}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                        {request.createdAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="size-3" />
                            {new Intl.DateTimeFormat('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            }).format(new Date(request.createdAt))}
                          </span>
                        )}
                        {request.changeItem?.newStartAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" />
                            {new Intl.DateTimeFormat('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            }).format(new Date(request.changeItem.newStartAt))}
                            {request.changeItem.newEndAt &&
                              ` - ${new Intl.DateTimeFormat('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              }).format(new Date(request.changeItem.newEndAt))}`}
                          </span>
                        )}
                      </div>

                      {request.justification && (
                        <p className="mt-1.5 text-xs text-muted-foreground line-clamp-1">
                          {request.justification}
                        </p>
                      )}
                    </div>

                    {isAdmin && isPending(request) && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-500/10"
                          onClick={() => setRejectTarget(request)}
                        >
                          <XCircle className="size-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                          onClick={() => setApproveTarget(request)}
                        >
                          <CheckCircle className="size-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 px-2">
            <span className="text-sm text-muted-foreground">
              Mostrando {(currentPage - 1) * itemsPerPage + 1} a{' '}
              {Math.min(currentPage * itemsPerPage, filtered.length)} de{' '}
              {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="size-4 mr-1" />
                Anterior
              </Button>
              <div className="flex items-center gap-1 mx-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    if (totalPages <= 7) return true
                    if (page === 1 || page === totalPages) return true
                    return Math.abs(page - currentPage) <= 1
                  })
                  .map((page, i, arr) => (
                    <span key={page} className="flex items-center">
                      {i > 0 && page - arr[i - 1] > 1 && (
                        <span className="px-2 text-muted-foreground">...</span>
                      )}
                      <Button
                        variant={currentPage === page ? 'default' : 'ghost'}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    </span>
                  ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
              >
                Próxima
                <ChevronRight className="size-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Approve Dialog */}
      <AlertDialog
        open={!!approveTarget}
        onOpenChange={(open) => !open && setApproveTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aprovar Solicitação</AlertDialogTitle>
            <AlertDialogDescription>
              Confirmar aprovação de{' '}
              <strong>{approveTarget && getRequestTitle(approveTarget)}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => approveTarget && handleApprove(approveTarget)}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? 'Aprovando...' : 'Aprovar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog
        open={!!rejectTarget}
        onOpenChange={(open) => !open && setRejectTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeitar Solicitação</AlertDialogTitle>
            <AlertDialogDescription>
              Confirmar rejeição de{' '}
              <strong>{rejectTarget && getRequestTitle(rejectTarget)}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => rejectTarget && handleReject(rejectTarget)}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? 'Rejeitando...' : 'Rejeitar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
