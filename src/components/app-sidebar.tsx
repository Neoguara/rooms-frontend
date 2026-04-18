import {
  Calendar,
  Home,
  DoorOpen,
  Users,
  Settings,
  BarChart3,
  Clock,
  Building2,
  FileText,
  LogOut,
  CheckSquare,
  LayoutGrid,
  Search,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarMenuBadge,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Link } from "@tanstack/react-router"

const mainNavItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Buscar Sala",
    url: "/buscar-sala",
    icon: Search,
  },
  {
    title: "Grade de Horários",
    url: "/grade",
    icon: Calendar,
  },
  {
    title: "Minhas Reservas",
    url: "/minhas-reservas",
    icon: Clock,
  },
]

const adminNavItems = [
  {
    title: "Gerenciar Salas",
    url: "/salas",
    icon: DoorOpen,
  },
  {
    title: "Montar Grade",
    url: "/montar-grade",
    icon: LayoutGrid,
  },
]

const managementItems = [
  {
    title: "Solicitações",
    url: "/solicitacoes",
    icon: FileText,
    badge: 2,
    requiresApproval: true,
  },
  {
    title: "Usuários",
    url: "/usuarios",
    icon: Users,
    requiresAdmin: true,
  },
  {
    title: "Relatórios",
    url: "/relatorios",
    icon: BarChart3,
  },
  {
    title: "Configurações",
    url: "/configuracoes",
    icon: Settings,
  },
]

export function AppSidebar() {
  const pathname = ""
  // const { user, logout, canApprove, canManageUsers } = useAuth()

  const filteredManagementItems = managementItems.filter((item) => {
    // if (item.requiresAdmin && !canManageUsers) return false
    // if (item.requiresApproval && !canApprove) return false
    return true
  })

  // const getRoleBadge = () => {
  //   if (!user) return null
  //   const roleColors = {
  //     professor: "bg-emerald-500/20 text-emerald-600 border-emerald-500/30",
  //     funcionario: "bg-blue-500/20 text-blue-600 border-blue-500/30",
  //     coordenador: "bg-amber-500/20 text-amber-600 border-amber-500/30",
  //     admin: "bg-purple-500/20 text-purple-600 border-purple-500/30",
  //   }
  //   const roleLabels = {
  //     professor: "Professor",
  //     funcionario: "Funcionário",
  //     coordenador: "Coordenador",
  //     admin: "Admin",
  //   }
  //   return (
  //     <Badge variant="outline" className={roleColors[user.role]}>
  //       {roleLabels[user.role]}
  //     </Badge>
  //   )
  // }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase()
  }

  return (
    <Sidebar>
      <SidebarHeader className="h-16 min-h-16 border-b border-sidebar-border">
        <div className="flex h-full items-center px-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary">
              <Building2 className="size-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold leading-none text-sidebar-foreground">
                Rooms
              </span>
              <span className="text-xs leading-none text-muted-foreground">
                Sistema de Reservas
              </span>
            </div>
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link to={item.url}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* {(canManageUsers || canApprove) && (
          <SidebarGroup>
            <SidebarGroupLabel>Gestão Acadêmica</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={pathname === item.url}>
                      <Link href={item.url}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )} */}

        {filteredManagementItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Administração</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredManagementItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={pathname === item.url}>
                      <Link to={item.url}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                    {item.badge && (
                      <SidebarMenuBadge className="bg-primary text-primary-foreground">
                        {item.badge}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      {/* <SidebarFooter className="border-t border-sidebar-border p-4">
        {user ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="size-9">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-medium text-sidebar-foreground truncate">
                  {user.name}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {user.email}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              {getRoleBadge()}
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Avatar className="size-9">
              <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                ?
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-sidebar-foreground">
                Não conectado
              </span>
              <Link href="/login" className="text-xs text-primary hover:underline">
                Fazer login
              </Link>
            </div>
          </div>
        )}
      </SidebarFooter> */}
    </Sidebar>
  )
}
