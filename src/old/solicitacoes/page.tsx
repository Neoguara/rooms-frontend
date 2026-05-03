"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Calendar,
  MapPin,
  User,
  MessageSquare,
  ArrowRightLeft,
  Filter,
  Search,
  X,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Eye,
  Building2,
  Users,
  Edit,
  Trash2,
  SlidersHorizontal,
  CalendarDays,
  Plus,
  Layers,
  CheckCheck,
  XOctagon,
  ArrowRight,
  Repeat,
  GitPullRequest,
  GitMerge,
  Circle,
  MoreHorizontal,
} from "lucide-react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { useAuth } from "@/components/auth-provider"
import {
  initialRequests,
  initialEditSessions,
  rooms,
  type BookingRequest,
  type EditSession,
  type EditSessionAction,
  getStatusName,
  getStatusColor,
  getSessionStatusName,
  getActionTypeName,
  getActionTypeColor,
  formatDate,
} from "@/lib/booking-data"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

type ViewMode = "individual" | "grouped"

export default function SolicitacoesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = React.useState(false)
  const [viewMode, setViewMode] = React.useState<ViewMode>("grouped")
  const [searchTerm, setSearchTerm] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [typeFilter, setTypeFilter] = React.useState<string>("all")
  
  // Paginação
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 10
  
  // Estados para sessões de edição
  const [editSessions, setEditSessions] = React.useState<EditSession[]>(initialEditSessions)
  const [expandedSessions, setExpandedSessions] = React.useState<Set<string>>(new Set())
  const [selectedActions, setSelectedActions] = React.useState<Set<string>>(new Set())
  
  // Estados para solicitações individuais
  const [requests, setRequests] = React.useState<BookingRequest[]>(initialRequests)
  
  // Estados para modais
  const [selectedSession, setSelectedSession] = React.useState<EditSession | null>(null)
  const [selectedAction, setSelectedAction] = React.useState<EditSessionAction | null>(null)
  const [showApproveDialog, setShowApproveDialog] = React.useState(false)
  const [showRejectDialog, setShowRejectDialog] = React.useState(false)
  const [showBatchApproveDialog, setShowBatchApproveDialog] = React.useState(false)
  const [showBatchRejectDialog, setShowBatchRejectDialog] = React.useState(false)
  const [rejectReason, setRejectReason] = React.useState("")
  const [approveMessage, setApproveMessage] = React.useState("")

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const canApprove = user?.role === "coordenador" || user?.role === "admin"

  // Filtrar sessões de edição
  const filteredSessions = React.useMemo(() => {
    return editSessions.filter((session) => {
      const matchesSearch =
        searchTerm === "" ||
        session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.description?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus =
        statusFilter === "all" || session.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [editSessions, searchTerm, statusFilter])

  // Filtrar solicitações individuais
  const filteredRequests = React.useMemo(() => {
    return requests.filter((request) => {
      const matchesSearch =
        searchTerm === "" ||
        request.booking.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.booking.userName.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus =
        statusFilter === "all" || request.status === statusFilter

      const matchesType =
        typeFilter === "all" || request.requestType === typeFilter

      return matchesSearch && matchesStatus && matchesType
    })
  }, [requests, searchTerm, statusFilter, typeFilter])

  // Paginação para sessões
  const paginatedSessions = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredSessions.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredSessions, currentPage, itemsPerPage])

  const totalSessionPages = Math.ceil(filteredSessions.length / itemsPerPage)

  // Paginação para requests
  const paginatedRequests = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredRequests.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredRequests, currentPage, itemsPerPage])

  const totalRequestPages = Math.ceil(filteredRequests.length / itemsPerPage)

  // Reset página quando filtros mudam
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, typeFilter, viewMode])

  // Estatísticas
  const stats = React.useMemo(() => {
    const sessionStats = {
      total: editSessions.length,
      pendente: editSessions.filter((s) => s.status === "pendente").length,
      parcial: editSessions.filter((s) => s.status === "parcial").length,
      aprovada: editSessions.filter((s) => s.status === "aprovada").length,
      rejeitada: editSessions.filter((s) => s.status === "rejeitada").length,
      totalActions: editSessions.reduce((acc, s) => acc + s.actions.length, 0),
      pendingActions: editSessions.reduce(
        (acc, s) => acc + s.actions.filter((a) => a.status === "pendente").length,
        0
      ),
    }

    const requestStats = {
      total: requests.length,
      pendente: requests.filter((r) => r.status === "pendente").length,
      aprovada: requests.filter((r) => r.status === "aprovada").length,
      rejeitada: requests.filter((r) => r.status === "rejeitada").length,
    }

    return { sessionStats, requestStats }
  }, [editSessions, requests])

  // Toggle sessão expandida
  const toggleSession = (sessionId: string) => {
    setExpandedSessions((prev) => {
      const next = new Set(prev)
      if (next.has(sessionId)) {
        next.delete(sessionId)
      } else {
        next.add(sessionId)
      }
      return next
    })
  }

  // Toggle seleção de ação
  const toggleActionSelection = (actionId: string) => {
    setSelectedActions((prev) => {
      const next = new Set(prev)
      if (next.has(actionId)) {
        next.delete(actionId)
      } else {
        next.add(actionId)
      }
      return next
    })
  }

  // Selecionar todas as ações pendentes de uma sessão
  const selectAllPendingActions = (session: EditSession) => {
    const pendingActionIds = session.actions
      .filter((a) => a.status === "pendente")
      .map((a) => a.id)
    setSelectedActions((prev) => {
      const next = new Set(prev)
      pendingActionIds.forEach((id) => next.add(id))
      return next
    })
  }

  // Desselecionar todas as ações de uma sessão
  const deselectAllActions = (session: EditSession) => {
    const actionIds = session.actions.map((a) => a.id)
    setSelectedActions((prev) => {
      const next = new Set(prev)
      actionIds.forEach((id) => next.delete(id))
      return next
    })
  }

  // Aprovar sessão inteira
  const handleApproveSession = (session: EditSession) => {
    setEditSessions((prev) =>
      prev.map((s) => {
        if (s.id === session.id) {
          return {
            ...s,
            status: "aprovada",
            respondedAt: new Date().toISOString(),
            respondedBy: user?.id,
            responseMessage: approveMessage || "Sessão aprovada.",
            actions: s.actions.map((a) => ({
              ...a,
              status: "aprovada" as const,
              respondedAt: new Date().toISOString(),
              respondedBy: user?.id,
            })),
          }
        }
        return s
      })
    )
    setShowApproveDialog(false)
    setSelectedSession(null)
    setApproveMessage("")
  }

  // Rejeitar sessão inteira
  const handleRejectSession = (session: EditSession) => {
    setEditSessions((prev) =>
      prev.map((s) => {
        if (s.id === session.id) {
          return {
            ...s,
            status: "rejeitada",
            respondedAt: new Date().toISOString(),
            respondedBy: user?.id,
            responseMessage: rejectReason || "Sessão rejeitada.",
            actions: s.actions.map((a) => ({
              ...a,
              status: "rejeitada" as const,
              respondedAt: new Date().toISOString(),
              respondedBy: user?.id,
              responseMessage: rejectReason,
            })),
          }
        }
        return s
      })
    )
    setShowRejectDialog(false)
    setSelectedSession(null)
    setRejectReason("")
  }

  // Aprovar ação individual
  const handleApproveAction = (sessionId: string, actionId: string) => {
    setEditSessions((prev) =>
      prev.map((s) => {
        if (s.id === sessionId) {
          const updatedActions = s.actions.map((a) => {
            if (a.id === actionId) {
              return {
                ...a,
                status: "aprovada" as const,
                respondedAt: new Date().toISOString(),
                respondedBy: user?.id,
                responseMessage: approveMessage || "Aprovado.",
              }
            }
            return a
          })
          
          // Verificar status da sessão
          const allApproved = updatedActions.every((a) => a.status === "aprovada")
          const allRejected = updatedActions.every((a) => a.status === "rejeitada")
          const hasPending = updatedActions.some((a) => a.status === "pendente")
          
          let newStatus: EditSession["status"] = s.status
          if (allApproved) newStatus = "aprovada"
          else if (allRejected) newStatus = "rejeitada"
          else if (!hasPending) newStatus = "parcial"
          
          return {
            ...s,
            status: newStatus,
            actions: updatedActions,
            updatedAt: new Date().toISOString(),
          }
        }
        return s
      })
    )
    setSelectedAction(null)
    setApproveMessage("")
  }

  // Rejeitar ação individual
  const handleRejectAction = (sessionId: string, actionId: string) => {
    setEditSessions((prev) =>
      prev.map((s) => {
        if (s.id === sessionId) {
          const updatedActions = s.actions.map((a) => {
            if (a.id === actionId) {
              return {
                ...a,
                status: "rejeitada" as const,
                respondedAt: new Date().toISOString(),
                respondedBy: user?.id,
                responseMessage: rejectReason || "Rejeitado.",
              }
            }
            return a
          })
          
          const allApproved = updatedActions.every((a) => a.status === "aprovada")
          const allRejected = updatedActions.every((a) => a.status === "rejeitada")
          const hasPending = updatedActions.some((a) => a.status === "pendente")
          
          let newStatus: EditSession["status"] = s.status
          if (allApproved) newStatus = "aprovada"
          else if (allRejected) newStatus = "rejeitada"
          else if (!hasPending) newStatus = "parcial"
          
          return {
            ...s,
            status: newStatus,
            actions: updatedActions,
            updatedAt: new Date().toISOString(),
          }
        }
        return s
      })
    )
    setSelectedAction(null)
    setRejectReason("")
  }

  // Aprovar ações selecionadas em lote
  const handleBatchApprove = () => {
    setEditSessions((prev) =>
      prev.map((s) => {
        const updatedActions = s.actions.map((a) => {
          if (selectedActions.has(a.id) && a.status === "pendente") {
            return {
              ...a,
              status: "aprovada" as const,
              respondedAt: new Date().toISOString(),
              respondedBy: user?.id,
              responseMessage: approveMessage || "Aprovado em lote.",
            }
          }
          return a
        })
        
        const allApproved = updatedActions.every((a) => a.status === "aprovada")
        const allRejected = updatedActions.every((a) => a.status === "rejeitada")
        const hasPending = updatedActions.some((a) => a.status === "pendente")
        
        let newStatus: EditSession["status"] = s.status
        if (allApproved) newStatus = "aprovada"
        else if (allRejected) newStatus = "rejeitada"
        else if (!hasPending) newStatus = "parcial"
        
        return {
          ...s,
          status: newStatus,
          actions: updatedActions,
          updatedAt: new Date().toISOString(),
        }
      })
    )
    setSelectedActions(new Set())
    setShowBatchApproveDialog(false)
    setApproveMessage("")
  }

  // Rejeitar ações selecionadas em lote
  const handleBatchReject = () => {
    setEditSessions((prev) =>
      prev.map((s) => {
        const updatedActions = s.actions.map((a) => {
          if (selectedActions.has(a.id) && a.status === "pendente") {
            return {
              ...a,
              status: "rejeitada" as const,
              respondedAt: new Date().toISOString(),
              respondedBy: user?.id,
              responseMessage: rejectReason || "Rejeitado em lote.",
            }
          }
          return a
        })
        
        const allApproved = updatedActions.every((a) => a.status === "aprovada")
        const allRejected = updatedActions.every((a) => a.status === "rejeitada")
        const hasPending = updatedActions.some((a) => a.status === "pendente")
        
        let newStatus: EditSession["status"] = s.status
        if (allApproved) newStatus = "aprovada"
        else if (allRejected) newStatus = "rejeitada"
        else if (!hasPending) newStatus = "parcial"
        
        return {
          ...s,
          status: newStatus,
          actions: updatedActions,
          updatedAt: new Date().toISOString(),
        }
      })
    )
    setSelectedActions(new Set())
    setShowBatchRejectDialog(false)
    setRejectReason("")
  }

  // Obter ícone do tipo de ação
  const getActionIcon = (type: EditSessionAction["type"]) => {
    switch (type) {
      case "add":
        return <Plus className="size-4" />
      case "edit":
        return <Edit className="size-4" />
      case "swap":
        return <ArrowRightLeft className="size-4" />
      case "remove":
        return <Trash2 className="size-4" />
    }
  }

  // Obter sala
  const getRoom = (roomId: string) => rooms.find((r) => r.id === roomId)

  if (!mounted) {
    return null
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-foreground">Solicitações</h1>
              <p className="text-sm text-muted-foreground">
                Gerencie solicitações de reserva e edições de grade
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {/* Cards de Estatísticas */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Sessões de Edição
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {stats.sessionStats.total}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.sessionStats.pendente} pendentes
                </p>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Ações Pendentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-500">
                  {stats.sessionStats.pendingActions}
                </div>
                <p className="text-xs text-muted-foreground">
                  de {stats.sessionStats.totalActions} ações totais
                </p>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Solicitações Avulsas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {stats.requestStats.total}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.requestStats.pendente} pendentes
                </p>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Taxa de Aprovação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-500">
                  {stats.requestStats.total > 0
                    ? Math.round(
                        (stats.requestStats.aprovada / stats.requestStats.total) * 100
                      )
                    : 0}
                  %
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.requestStats.aprovada} aprovadas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filtros e Controles */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar solicitações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="parcial">Parcial</SelectItem>
                  <SelectItem value="aprovada">Aprovada</SelectItem>
                  <SelectItem value="rejeitada">Rejeitada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              {selectedActions.size > 0 && canApprove && (
                <>
                  <span className="text-sm text-muted-foreground">
                    {selectedActions.size} selecionadas
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedActions(new Set())}
                  >
                    Limpar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600"
                    onClick={() => setShowBatchRejectDialog(true)}
                  >
                    <XCircle className="mr-1 size-4" />
                    Rejeitar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setShowBatchApproveDialog(true)}
                  >
                    <CheckCircle className="mr-1 size-4" />
                    Aprovar
                  </Button>
                </>
              )}
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                <TabsList>
                  <TabsTrigger value="grouped">
                    <Layers className="mr-1 size-4" />
                    Agrupado
                  </TabsTrigger>
                  <TabsTrigger value="individual">
                    <FileText className="mr-1 size-4" />
                    Individual
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Conteúdo baseado no modo de visualização */}
          {viewMode === "grouped" ? (
            <div className="space-y-0">
              {/* Lista estilo GitHub */}
              <div className="rounded-md border border-border overflow-hidden">
                {/* Header da lista */}
                <div className="bg-muted/50 px-4 py-3 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      <button 
                        className={cn(
                          "flex items-center gap-1.5 font-medium",
                          statusFilter === "pendente" || statusFilter === "all" ? "text-foreground" : "text-muted-foreground"
                        )}
                        onClick={() => setStatusFilter(statusFilter === "pendente" ? "all" : "pendente")}
                      >
                        <Circle className="size-4 fill-amber-500 text-amber-500" />
                        {stats.sessionStats.pendente} Pendentes
                      </button>
                      <button 
                        className={cn(
                          "flex items-center gap-1.5",
                          statusFilter === "aprovada" ? "text-foreground font-medium" : "text-muted-foreground"
                        )}
                        onClick={() => setStatusFilter(statusFilter === "aprovada" ? "all" : "aprovada")}
                      >
                        <CheckCircle className="size-4 text-emerald-500" />
                        {stats.sessionStats.aprovada} Aprovadas
                      </button>
                      <button 
                        className={cn(
                          "flex items-center gap-1.5",
                          statusFilter === "rejeitada" ? "text-foreground font-medium" : "text-muted-foreground"
                        )}
                        onClick={() => setStatusFilter(statusFilter === "rejeitada" ? "all" : "rejeitada")}
                      >
                        <XCircle className="size-4 text-red-500" />
                        {stats.sessionStats.rejeitada} Rejeitadas
                      </button>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {filteredSessions.length} sessão(ões)
                    </span>
                  </div>
                </div>

                {/* Lista de sessões */}
                {filteredSessions.length === 0 ? (
                  <div className="py-16 text-center bg-card">
                    <GitPullRequest className="mx-auto mb-4 size-12 text-muted-foreground/30" />
                    <p className="text-muted-foreground font-medium">
                      Nenhuma sessão de edição encontrada
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Tente ajustar os filtros de busca
                    </p>
                  </div>
                ) : (
                  paginatedSessions.map((session, index) => {
                    const isExpanded = expandedSessions.has(session.id)
                    const pendingCount = session.actions.filter(
                      (a) => a.status === "pendente"
                    ).length
                    const approvedCount = session.actions.filter(
                      (a) => a.status === "aprovada"
                    ).length
                    const rejectedCount = session.actions.filter(
                      (a) => a.status === "rejeitada"
                    ).length
                    const selectedInSession = session.actions.filter((a) =>
                      selectedActions.has(a.id)
                    ).length

                    return (
                      <div 
                        key={session.id} 
                        className={cn(
                          "bg-card",
                          index !== paginatedSessions.length - 1 && "border-b border-border"
                        )}
                      >
                        <Collapsible open={isExpanded} onOpenChange={() => toggleSession(session.id)}>
                          <div className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                            {/* Status Icon */}
                            <div className="mt-1">
                              {session.status === "aprovada" ? (
                                <GitMerge className="size-5 text-purple-500" />
                              ) : session.status === "rejeitada" ? (
                                <XCircle className="size-5 text-red-500" />
                              ) : session.status === "parcial" ? (
                                <GitPullRequest className="size-5 text-blue-500" />
                              ) : (
                                <GitPullRequest className="size-5 text-emerald-500" />
                              )}
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                  <CollapsibleTrigger asChild>
                                    <button className="text-left group">
                                      <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                        {session.title}
                                      </span>
                                    </button>
                                  </CollapsibleTrigger>
                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                                    <span>
                                      aberta por <span className="font-medium text-foreground">{session.userName}</span>
                                    </span>
                                    <span>
                                      {format(new Date(session.createdAt), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                                    </span>
                                    {session.description && (
                                      <span className="hidden sm:inline truncate max-w-[200px]">
                                        {session.description}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Right side info */}
                                <div className="flex items-center gap-3 shrink-0">
                                  {/* Action counts */}
                                  <div className="hidden sm:flex items-center gap-2 text-xs">
                                    {pendingCount > 0 && (
                                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
                                        <Clock className="size-3" />
                                        {pendingCount}
                                      </span>
                                    )}
                                    {approvedCount > 0 && (
                                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                                        <CheckCircle className="size-3" />
                                        {approvedCount}
                                      </span>
                                    )}
                                    {rejectedCount > 0 && (
                                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-600">
                                        <XCircle className="size-3" />
                                        {rejectedCount}
                                      </span>
                                    )}
                                  </div>

                                  {/* Actions */}
                                  {canApprove && session.status === "pendente" && (
                                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-500/10"
                                        onClick={() => {
                                          setSelectedSession(session)
                                          setShowRejectDialog(true)
                                        }}
                                      >
                                        <XCircle className="size-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                                        onClick={() => {
                                          setSelectedSession(session)
                                          setShowApproveDialog(true)
                                        }}
                                      >
                                        <CheckCircle className="size-4" />
                                      </Button>
                                    </div>
                                  )}

                                  <CollapsibleTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                      <ChevronDown className={cn(
                                        "size-4 transition-transform",
                                        isExpanded && "rotate-180"
                                      )} />
                                    </Button>
                                  </CollapsibleTrigger>
                                </div>
                              </div>
                            </div>
                          </div>

                          <CollapsibleContent>
                            <div className="px-4 pb-4 pt-0 pl-12">
                              <div className="border border-border rounded-md overflow-hidden bg-muted/20">
                                {/* Controles de seleção */}
                                {canApprove && pendingCount > 0 && (
                                  <div className="px-3 py-2 border-b border-border bg-muted/50 flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 text-xs"
                                      onClick={() => selectAllPendingActions(session)}
                                    >
                                      Selecionar pendentes
                                    </Button>
                                    {selectedInSession > 0 && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 text-xs"
                                        onClick={() => deselectAllActions(session)}
                                      >
                                        Limpar ({selectedInSession})
                                      </Button>
                                    )}
                                  </div>
                                )}

                                {/* Lista de ações */}
                                {session.actions.map((action, actionIndex) => {
                                  const room = getRoom(action.booking.roomId)
                                  const isSelected = selectedActions.has(action.id)

                                  return (
                                    <div
                                      key={action.id}
                                      className={cn(
                                        "flex items-start gap-3 px-3 py-3 transition-colors",
                                        actionIndex !== session.actions.length - 1 && "border-b border-border",
                                        isSelected ? "bg-primary/5" : "bg-card hover:bg-muted/30"
                                      )}
                                    >
                                      {canApprove && action.status === "pendente" && (
                                        <Checkbox
                                          checked={isSelected}
                                          onCheckedChange={() => toggleActionSelection(action.id)}
                                          className="mt-0.5"
                                        />
                                      )}
                                      
                                      <div className={cn(
                                        "size-8 rounded flex items-center justify-center shrink-0",
                                        action.type === "add" ? "bg-emerald-500/10 text-emerald-600" :
                                        action.type === "edit" ? "bg-blue-500/10 text-blue-600" :
                                        action.type === "swap" ? "bg-purple-500/10 text-purple-600" :
                                        "bg-red-500/10 text-red-600"
                                      )}>
                                        {getActionIcon(action.type)}
                                      </div>
                                      
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="font-medium text-sm">
                                            {action.description}
                                          </span>
                                          <Badge
                                            variant="outline"
                                            className={cn(
                                              "text-[10px] h-5",
                                              action.status === "aprovada" && "border-emerald-500/50 text-emerald-600 bg-emerald-500/10",
                                              action.status === "rejeitada" && "border-red-500/50 text-red-600 bg-red-500/10",
                                              action.status === "pendente" && "border-amber-500/50 text-amber-600 bg-amber-500/10"
                                            )}
                                          >
                                            {getStatusName(action.status as any)}
                                          </Badge>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                                          <span className="flex items-center gap-1">
                                            <FileText className="size-3" />
                                            {action.booking.title}
                                          </span>
                                          <span className="flex items-center gap-1">
                                            <MapPin className="size-3" />
                                            {room?.name || "N/A"}
                                          </span>
                                          <span className="flex items-center gap-1">
                                            <Calendar className="size-3" />
                                            {formatDate(action.booking.date)}
                                          </span>
                                          <span className="flex items-center gap-1">
                                            <Clock className="size-3" />
                                            {action.booking.startTime} - {action.booking.endTime}
                                          </span>
                                        </div>
                                        {action.type === "swap" && action.swapTarget && (
                                          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                            <ArrowRightLeft className="size-3 text-purple-500" />
                                            Trocar com: <span className="font-medium text-foreground">{action.swapTarget.userName}</span>
                                          </div>
                                        )}
                                        {action.responseMessage && (
                                          <div className="mt-2 text-xs px-2 py-1.5 rounded bg-muted text-muted-foreground">
                                            <span className="font-medium">Resposta:</span> {action.responseMessage}
                                          </div>
                                        )}
                                      </div>
                                      
                                      {canApprove && action.status === "pendente" && (
                                        <div className="flex items-center gap-1 shrink-0">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-500/10"
                                            onClick={() => {
                                              setSelectedSession(session)
                                              setSelectedAction(action)
                                              setShowRejectDialog(true)
                                            }}
                                          >
                                            <XCircle className="size-4" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                                            onClick={() => {
                                              handleApproveAction(session.id, action.id)
                                            }}
                                          >
                                            <CheckCircle className="size-4" />
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Paginação */}
              {totalSessionPages > 1 && (
                <div className="flex items-center justify-between mt-4 px-2">
                  <span className="text-sm text-muted-foreground">
                    Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredSessions.length)} de {filteredSessions.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="size-4 mr-1" />
                      Anterior
                    </Button>
                    <div className="flex items-center gap-1 mx-2">
                      {Array.from({ length: totalSessionPages }, (_, i) => i + 1)
                        .filter(page => {
                          if (totalSessionPages <= 7) return true
                          if (page === 1 || page === totalSessionPages) return true
                          if (Math.abs(page - currentPage) <= 1) return true
                          return false
                        })
                        .map((page, i, arr) => {
                          const showEllipsis = i > 0 && page - arr[i - 1] > 1
                          return (
                            <React.Fragment key={page}>
                              {showEllipsis && <span className="px-2 text-muted-foreground">...</span>}
                              <Button
                                variant={currentPage === page ? "default" : "ghost"}
                                size="sm"
                                className="w-8 h-8 p-0"
                                onClick={() => setCurrentPage(page)}
                              >
                                {page}
                              </Button>
                            </React.Fragment>
                          )
                        })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalSessionPages, p + 1))}
                      disabled={currentPage === totalSessionPages}
                    >
                      Próxima
                      <ChevronRight className="size-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Visualização individual
            <div className="space-y-0">
              <div className="rounded-md border border-border overflow-hidden">
                {/* Header da lista */}
                <div className="bg-muted/50 px-4 py-3 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      <button 
                        className={cn(
                          "flex items-center gap-1.5 font-medium",
                          statusFilter === "pendente" || statusFilter === "all" ? "text-foreground" : "text-muted-foreground"
                        )}
                        onClick={() => setStatusFilter(statusFilter === "pendente" ? "all" : "pendente")}
                      >
                        <Circle className="size-4 fill-amber-500 text-amber-500" />
                        {stats.requestStats.pendente} Pendentes
                      </button>
                      <button 
                        className={cn(
                          "flex items-center gap-1.5",
                          statusFilter === "aprovada" ? "text-foreground font-medium" : "text-muted-foreground"
                        )}
                        onClick={() => setStatusFilter(statusFilter === "aprovada" ? "all" : "aprovada")}
                      >
                        <CheckCircle className="size-4 text-emerald-500" />
                        {stats.requestStats.aprovada} Aprovadas
                      </button>
                      <button 
                        className={cn(
                          "flex items-center gap-1.5",
                          statusFilter === "rejeitada" ? "text-foreground font-medium" : "text-muted-foreground"
                        )}
                        onClick={() => setStatusFilter(statusFilter === "rejeitada" ? "all" : "rejeitada")}
                      >
                        <XCircle className="size-4 text-red-500" />
                        {stats.requestStats.rejeitada} Rejeitadas
                      </button>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {filteredRequests.length} solicitação(ões)
                    </span>
                  </div>
                </div>

                {/* Lista de solicitações */}
                {filteredRequests.length === 0 ? (
                  <div className="py-16 text-center bg-card">
                    <FileText className="mx-auto mb-4 size-12 text-muted-foreground/30" />
                    <p className="text-muted-foreground font-medium">
                      Nenhuma solicitação encontrada
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Tente ajustar os filtros de busca
                    </p>
                  </div>
                ) : (
                  paginatedRequests.map((request, index) => {
                    const room = getRoom(request.booking.roomId)

                    return (
                      <div 
                        key={request.id}
                        className={cn(
                          "flex items-start gap-3 px-4 py-3 bg-card hover:bg-muted/30 transition-colors",
                          index !== paginatedRequests.length - 1 && "border-b border-border"
                        )}
                      >
                        {/* Status Icon */}
                        <div className="mt-0.5">
                          {request.status === "aprovada" ? (
                            <CheckCircle className="size-5 text-emerald-500" />
                          ) : request.status === "rejeitada" ? (
                            <XCircle className="size-5 text-red-500" />
                          ) : (
                            <Circle className="size-5 fill-amber-500 text-amber-500" />
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <button 
                                  className="font-semibold text-foreground hover:text-primary transition-colors text-left"
                                  onClick={() => router.push(`/reserva/${request.booking.id}`)}
                                >
                                  {request.booking.title}
                                </button>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[10px] h-5",
                                    request.requestType === "new" && "border-emerald-500/50 text-emerald-600 bg-emerald-500/10",
                                    request.requestType === "change" && "border-blue-500/50 text-blue-600 bg-blue-500/10",
                                    request.requestType === "swap" && "border-purple-500/50 text-purple-600 bg-purple-500/10",
                                    request.requestType === "cancel" && "border-red-500/50 text-red-600 bg-red-500/10"
                                  )}
                                >
                                  {request.requestType === "new" && "Nova Reserva"}
                                  {request.requestType === "change" && "Alteração"}
                                  {request.requestType === "swap" && "Troca"}
                                  {request.requestType === "cancel" && "Cancelamento"}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                                <span>
                                  por <span className="font-medium text-foreground">{request.booking.userName}</span>
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="size-3" />
                                  {room?.name || "N/A"}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="size-3" />
                                  {formatDate(request.booking.date)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="size-3" />
                                  {request.booking.startTime} - {request.booking.endTime}
                                </span>
                              </div>
                              {request.message && (
                                <p className="mt-1.5 text-xs text-muted-foreground line-clamp-1">
                                  {request.message}
                                </p>
                              )}
                            </div>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              className="shrink-0 h-8"
                              onClick={() => router.push(`/reserva/${request.booking.id}`)}
                            >
                              <Eye className="size-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Paginação */}
              {totalRequestPages > 1 && (
                <div className="flex items-center justify-between mt-4 px-2">
                  <span className="text-sm text-muted-foreground">
                    Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredRequests.length)} de {filteredRequests.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="size-4 mr-1" />
                      Anterior
                    </Button>
                    <div className="flex items-center gap-1 mx-2">
                      {Array.from({ length: totalRequestPages }, (_, i) => i + 1)
                        .filter(page => {
                          if (totalRequestPages <= 7) return true
                          if (page === 1 || page === totalRequestPages) return true
                          if (Math.abs(page - currentPage) <= 1) return true
                          return false
                        })
                        .map((page, i, arr) => {
                          const showEllipsis = i > 0 && page - arr[i - 1] > 1
                          return (
                            <React.Fragment key={page}>
                              {showEllipsis && <span className="px-2 text-muted-foreground">...</span>}
                              <Button
                                variant={currentPage === page ? "default" : "ghost"}
                                size="sm"
                                className="w-8 h-8 p-0"
                                onClick={() => setCurrentPage(page)}
                              >
                                {page}
                              </Button>
                            </React.Fragment>
                          )
                        })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalRequestPages, p + 1))}
                      disabled={currentPage === totalRequestPages}
                    >
                      Próxima
                      <ChevronRight className="size-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Dialog de Aprovar Sessão */}
        <AlertDialog open={showApproveDialog && !!selectedSession && !selectedAction} onOpenChange={setShowApproveDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Aprovar Sessão de Edição</AlertDialogTitle>
              <AlertDialogDescription>
                Você está prestes a aprovar todas as {selectedSession?.actions.length} ações
                desta sessão de edição de <strong>{selectedSession?.userName}</strong>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium">Mensagem (opcional)</label>
              <Textarea
                placeholder="Adicione uma mensagem..."
                value={approveMessage}
                onChange={(e) => setApproveMessage(e.target.value)}
                className="mt-2"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSelectedSession(null)}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction onClick={() => selectedSession && handleApproveSession(selectedSession)}>
                Aprovar Tudo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog de Rejeitar Sessão */}
        <AlertDialog open={showRejectDialog && !!selectedSession && !selectedAction} onOpenChange={setShowRejectDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Rejeitar Sessão de Edição</AlertDialogTitle>
              <AlertDialogDescription>
                Você está prestes a rejeitar todas as {selectedSession?.actions.length} ações
                desta sessão de edição de <strong>{selectedSession?.userName}</strong>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium">Motivo da rejeição</label>
              <Textarea
                placeholder="Informe o motivo..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="mt-2"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSelectedSession(null)}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={() => selectedSession && handleRejectSession(selectedSession)}
              >
                Rejeitar Tudo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog de Rejeitar Ação Individual */}
        <AlertDialog open={showRejectDialog && !!selectedAction} onOpenChange={(open) => {
          if (!open) {
            setShowRejectDialog(false)
            setSelectedAction(null)
          }
        }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Rejeitar Ação</AlertDialogTitle>
              <AlertDialogDescription>
                Você está prestes a rejeitar: <strong>{selectedAction?.description}</strong>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium">Motivo da rejeição</label>
              <Textarea
                placeholder="Informe o motivo..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="mt-2"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={() => {
                  if (selectedSession && selectedAction) {
                    handleRejectAction(selectedSession.id, selectedAction.id)
                  }
                  setShowRejectDialog(false)
                }}
              >
                Rejeitar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog de Aprovar em Lote */}
        <AlertDialog open={showBatchApproveDialog} onOpenChange={setShowBatchApproveDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Aprovar Ações Selecionadas</AlertDialogTitle>
              <AlertDialogDescription>
                Você está prestes a aprovar <strong>{selectedActions.size}</strong> ações selecionadas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium">Mensagem (opcional)</label>
              <Textarea
                placeholder="Adicione uma mensagem..."
                value={approveMessage}
                onChange={(e) => setApproveMessage(e.target.value)}
                className="mt-2"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleBatchApprove}>
                Aprovar {selectedActions.size} ações
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog de Rejeitar em Lote */}
        <AlertDialog open={showBatchRejectDialog} onOpenChange={setShowBatchRejectDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Rejeitar Ações Selecionadas</AlertDialogTitle>
              <AlertDialogDescription>
                Você está prestes a rejeitar <strong>{selectedActions.size}</strong> ações selecionadas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium">Motivo da rejeição</label>
              <Textarea
                placeholder="Informe o motivo..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="mt-2"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={handleBatchReject}
              >
                Rejeitar {selectedActions.size} ações
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarInset>
    </SidebarProvider>
  )
}
