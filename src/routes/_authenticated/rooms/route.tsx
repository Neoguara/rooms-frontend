import { createFileRoute, Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { DoorOpen, Building2, Layers, Package } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export const Route = createFileRoute('/_authenticated/rooms')({
  component: RoomsLayout,
})

function RoomsLayout() {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const activeTab = pathname.startsWith('/rooms/buildings')
    ? 'buildings'
    : pathname.startsWith('/rooms/room-types')
    ? 'room-types'
    : pathname.startsWith('/rooms/resources')
    ? 'resources'
    : 'rooms'

  function onTabChange(tab: string) {
    const paths: Record<string, string> = {
      rooms: '/rooms',
      buildings: '/rooms/buildings',
      'room-types': '/rooms/room-types',
      resources: '/rooms/resources',
    }
    navigate({ to: paths[tab] })
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <DoorOpen className="size-5 text-primary" />
        <h1 className="text-lg font-semibold">Gerenciamento de Salas</h1>
      </header>

      <main className="flex flex-1 flex-col overflow-auto p-6">
        <Tabs value={activeTab} onValueChange={onTabChange}>
          <TabsList className="mb-6">
            <TabsTrigger value="rooms" className="flex items-center gap-2">
              <DoorOpen className="size-4" />
              Salas
            </TabsTrigger>
            <TabsTrigger value="buildings" className="flex items-center gap-2">
              <Building2 className="size-4" />
              Prédios
            </TabsTrigger>
            <TabsTrigger value="room-types" className="flex items-center gap-2">
              <Layers className="size-4" />
              Tipos de Sala
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-2">
              <Package className="size-4" />
              Recursos
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Outlet />
      </main>
    </>
  )
}
