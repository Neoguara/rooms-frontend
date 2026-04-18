import { createRootRouteWithContext, useRouterState } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { AppSidebar } from '#/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '#/components/ui/sidebar'
import type { useAPI } from '#/hooks/useAPI'
export interface RouterContext {
  queryClient: QueryClient
  api: ReturnType<typeof useAPI>['api']
}

export const Route = createRootRouteWithContext<RouterContext>()({
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isLoginPage = pathname === '/login' || pathname === '/login/'

  if (isLoginPage) {
    return <>{children}</>
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
       {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
