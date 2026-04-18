import * as React from "react"
import { createFileRoute } from '@tanstack/react-router'
import {
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Shield,
  UserPlus,
  Users,
  Crown,
  User,
  AlertTriangle,
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAPI } from "@/hooks/useAPI"
import { useAuth } from "@/components/auth-provider"
import type { components } from "@/api/schema"

export const Route = createFileRoute('/usuarios/')({
  component: UsuariosPage,
})

type UserRole = "ADMIN" | "USER"
type UserResponse = components["schemas"]["UserResponse"]

const roleConfig: Record<UserRole, { label: string; icon: React.ElementType; color: string }> = {
  ADMIN: {
    label: "Administrador",
    icon: Crown,
    color: "bg-purple-500/20 text-purple-600 border-purple-500/30",
  },
  USER: {
    label: "Usuário",
    icon: User,
    color: "bg-blue-500/20 text-blue-600 border-blue-500/30",
  },
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase()
}

function UsuariosPage() {
  const { api } = useAPI()
  const { user: currentUser } = useAuth()

  const { data: users = [], isLoading, refetch } = api.users.findAll.useQuery()

  const createMutation = api.users.create.useMutation()
  const updateMutation = api.users.update.useMutation()
  const deleteMutation = api.users.ddelete.useMutation()

  const [searchQuery, setSearchQuery] = React.useState("")
  const [filterRole, setFilterRole] = React.useState<string>("all")

  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [editingUser, setEditingUser] = React.useState<UserResponse | null>(null)
  const [userToDelete, setUserToDelete] = React.useState<UserResponse | null>(null)

  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    password: "",
    role: "USER" as UserRole,
  })

  const userList = Array.isArray(users) ? users : []

  const filteredUsers = React.useMemo(() => {
    return userList.filter((u) => {
      const matchesSearch =
        (u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        (u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      const matchesRole = filterRole === "all" || u.role === filterRole
      return matchesSearch && matchesRole
    })
  }, [userList, searchQuery, filterRole])

  const stats = React.useMemo(() => ({
    total: userList.length,
    admins: userList.filter((u) => u.role === "ADMIN").length,
    users: userList.filter((u) => u.role === "USER").length,
  }), [userList])

  const openCreateDialog = () => {
    setEditingUser(null)
    setFormData({ name: "", email: "", password: "", role: "USER" })
    setIsDialogOpen(true)
  }

  const openEditDialog = (u: UserResponse) => {
    setEditingUser(u)
    setFormData({ name: u.name ?? "", email: u.email ?? "", password: "", role: (u.role as UserRole) ?? "USER" })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (editingUser?.id) {
      await updateMutation.mutateAsync({
        body: { name: formData.name, email: formData.email, role: formData.role, ...(formData.password ? { password: formData.password } : {}) },
        path: { id: editingUser.id },
      })
    } else {
      await createMutation.mutateAsync({
        body: { name: formData.name, email: formData.email, password: formData.password, role: formData.role },
      })
    }
    setIsDialogOpen(false)
    refetch()
  }

  const handleDelete = async () => {
    if (userToDelete?.id) {
      await deleteMutation.mutateAsync({ path: { id: userToDelete.id } })
      setUserToDelete(null)
      setIsDeleteDialogOpen(false)
      refetch()
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending
  const isDeleting = deleteMutation.isPending

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
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">cadastrados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administradores</CardTitle>
              <Crown className="size-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.admins}</div>
              <p className="text-xs text-muted-foreground">com acesso total</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários Padrão</CardTitle>
              <Shield className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.users}</div>
              <p className="text-xs text-muted-foreground">acesso básico</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 flex-col gap-4 sm:flex-row">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="ADMIN">Administradores</SelectItem>
                    <SelectItem value="USER">Usuários</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={openCreateDialog}>
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
              {isLoading ? "Carregando..." : `${filteredUsers.length} usuário(s) encontrado(s)`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">
                        <div className="text-muted-foreground">Carregando usuários...</div>
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <Users className="mb-2 size-8" />
                          <p>Nenhum usuário encontrado</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((u) => {
                      const role = roleConfig[(u.role as UserRole) ?? "USER"]
                      const RoleIcon = role.icon
                      const isCurrentUser = currentUser?.id === u.id

                      return (
                        <TableRow key={u.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="size-9">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {getInitials(u.name ?? u.email ?? "?")}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="font-medium">{u.name}</span>
                                <span className="text-xs text-muted-foreground">{u.email}</span>
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
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8">
                                  <MoreHorizontal className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => openEditDialog(u)}>
                                  <Pencil className="mr-2 size-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  disabled={isCurrentUser}
                                  onClick={() => {
                                    setUserToDelete(u)
                                    setIsDeleteDialogOpen(true)
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

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Atualize as informações do usuário."
                : "Preencha as informações para cadastrar um novo usuário."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Nome Completo</label>
              <Input
                placeholder="Ex: João Silva"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="email@exemplo.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">
                {editingUser ? "Nova Senha (deixe em branco para manter)" : "Senha"}
              </label>
              <Input
                type="password"
                placeholder={editingUser ? "••••••••" : "Senha de acesso"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!editingUser}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Perfil</label>
              <Select
                value={formData.role}
                onValueChange={(v: UserRole) => setFormData({ ...formData, role: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">
                    <div className="flex items-center gap-2">
                      <User className="size-4" />
                      Usuário
                    </div>
                  </SelectItem>
                  <SelectItem value="ADMIN">
                    <div className="flex items-center gap-2">
                      <Crown className="size-4" />
                      Administrador
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.name || !formData.email || (!editingUser && !formData.password) || isSaving}
            >
              {isSaving ? "Salvando..." : editingUser ? "Salvar Alterações" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-destructive" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o Usuários
              <span className="font-semibold"> {userToDelete?.name}</span>?
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 focus:ring-destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              asChild
            >
              <Button variant="destructive" disabled={isDeleting}>
                <Trash2 className="mr-2 size-4" />
                {isDeleting ? "Excluindo..." : "Excluir"}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
