import { createFileRoute } from '@tanstack/react-router'
import {
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserPlus,
  Users,
  Crown,
  User,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAPI } from '@/hooks/use-api'
import { useAuth } from '@/hooks/use-auth'
import { UserStatsCards } from '#/components/user/user-stats-cards'
import { useCallback, useMemo, useState, type ElementType } from 'react'

import type { components } from "@/api/schema"

import { UserFormDialog } from '#/components/user/user-form-dialog'
import { DeleteUserDialog } from '#/components/user/delete-user-dialog'
import { LoadingAuthenticated } from '#/components/loading-authenticated'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/users/')({
  component: UsersPage,
  loader: async ({ context: { api } }) => {
    await api.users.findAll.prefetchQuery()
  },
  pendingComponent: LoadingAuthenticated
})

type UserResponse = components["schemas"]["UserResponse"]
type UserRole = 'ADMIN' | 'USER'

const roleConfig: Record<
  UserRole,
  { label: string; icon: ElementType; color: string }
> = {
  ADMIN: {
    label: 'Administrador',
    icon: Crown,
    color: 'bg-purple-500/20 text-purple-600 border-purple-500/30',
  },
  USER: {
    label: 'Usuário',
    icon: User,
    color: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
  },
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(
    new Date(dateStr),
  )
}


function UsersPage() {

  const { api } = useAPI()
  const { user: currentUser } = useAuth()

  const { data: users = [] } = api.users.findAll.useSuspenseQuery()
  const updateStatusMutation = api.users.updateStatus.useMutation()

  const handleToggleStatus = useCallback(async (u: UserResponse) => {
    if (!u.id || u.status === 'DELETED') return
    const nextStatus = u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    try {
      await updateStatusMutation.mutateAsync({ path: { id: u.id }, body: { status: nextStatus } })
      await api.users.findAll.invalidateQueries()
      toast.success(nextStatus === 'ACTIVE' ? 'Usuário ativado com sucesso.' : 'Usuário desativado com sucesso.')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao atualizar status.')
    }
  }, [updateStatusMutation, api])

  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null)
  const [userToDelete, setUserToDelete] = useState<UserResponse | null>(null)

  const userList = Array.isArray(users) ? users : []

  const filteredUsers = useMemo(() => {
    return userList.filter((u) => {
      const matchesSearch =
        (u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        (u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      const matchesRole = filterRole === 'all' || u.role === filterRole
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && u.status === 'ACTIVE') ||
        (filterStatus === 'inactive' && u.status !== 'ACTIVE')
      return matchesSearch && matchesRole && matchesStatus
    })
  }, [userList, searchQuery, filterRole, filterStatus])

  const stats = useMemo(
    () => ({
      total: userList.length,
      admins: userList.filter((u) => u.role === 'ADMIN').length,
      users: userList.filter((u) => u.role === 'USER').length,
      active: userList.filter((u) => u.status === 'ACTIVE').length,
    }),
    [userList],
  )

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex items-center gap-2">
          <Users className="size-5 text-primary" />
          <h1 className="text-lg font-semibold">Gerenciamento de Usuários</h1>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6">
        <UserStatsCards
          total={stats.total}
          admins={stats.admins}
          users={stats.users}
          active={stats.active}
        />

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 flex-col gap-4 sm:flex-row">
                <div className="relative flex-1 max-w-xl">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou email..."
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os perfis</SelectItem>
                    <SelectItem value="ADMIN">Administradores</SelectItem>
                    <SelectItem value="USER">Usuários</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
              onClick={() => {
                setEditingUser(null)
                setIsFormOpen(true)
              }}
              >
                <UserPlus className="mr-2 size-4" />
                Novo Usuário
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Usuários Cadastrados</CardTitle>
            <CardDescription>
              {`${filteredUsers.length} usuário(s) encontrado(s)`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cadastrado em</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <Users className="mb-2 size-8" />
                          <p>Nenhum usuário encontrado</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((u) => {
                      const role = roleConfig[(u.role as UserRole) ?? 'USER']
                      const RoleIcon = role.icon
                      const isCurrentUser = currentUser?.id === u.id

                      return (
                        <TableRow key={u.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="size-9">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {getInitials(u.name ?? u.email ?? '?')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="font-medium">{u.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {u.email}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={role.color}>
                              <RoleIcon className="mr-1 size-3" />
                              {role.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {u.status === 'ACTIVE' ? (
                              <Badge
                                variant="outline"
                                className="bg-green-500/10 text-green-600 border-green-500/30"
                              >
                                <CheckCircle2 className="mr-1 size-3" />
                                Ativo
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-muted text-muted-foreground"
                              >
                                <XCircle className="mr-1 size-3" />
                                Inativo
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(u.createdAt)}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8"
                                >
                                  <MoreHorizontal className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingUser(u)
                                    setIsFormOpen(true)
                                  }}
                                >
                                  <Pencil className="mr-2 size-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  disabled={isCurrentUser}
                                  onClick={() => handleToggleStatus(u)}
                                >
                                  {u.status === 'ACTIVE' ? (
                                    <>
                                      <XCircle className="mr-2 size-4" />
                                      Desativar
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="mr-2 size-4" />
                                      Ativar
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  disabled={isCurrentUser}
                                  onClick={() => {
                                    setUserToDelete(u)
                                    setIsDeleteOpen(true)
                                  }}
                                >
                                  <Trash2 className="mr-2 size-4" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      <UserFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        editingUser={editingUser}
      />

      <DeleteUserDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        user={userToDelete}
      />
    </>
  )
}
