import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { AppSidebar } from '#/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '#/components/ui/sidebar'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({
    context: {
      authentication: { isLogged },
    },
  }) => {
    if (!isLogged()) {
      throw redirect({
        to: '/login',
      })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  )
}
