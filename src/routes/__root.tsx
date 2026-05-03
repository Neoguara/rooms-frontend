import { createRootRouteWithContext } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import type { useAPI } from '#/hooks/use-api'
import type { AuthContextType } from '#/hooks/use-auth'

export interface RouterContext {
  queryClient: QueryClient,
  authentication: AuthContextType
  api: ReturnType<typeof useAPI>['api']
}

export const Route = createRootRouteWithContext<RouterContext>()({
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
