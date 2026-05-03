import { requestFn as baseRequestFn } from '@openapi-qraft/react'
import { createContext, useContext, useMemo } from 'react'
import type { QueryClient } from '@tanstack/react-query'
import { createAPIClient } from '#/api'

const APIContext = createContext<{
  api: ReturnType<typeof createApiClientInstance>
}>(null!)

const authRequestFn: typeof baseRequestFn = (schema, options) => {
  const token = localStorage.getItem('auth_token')
  return baseRequestFn(schema, {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
}

function createApiClientInstance(queryClient: QueryClient) {
  return createAPIClient({
    requestFn: authRequestFn,
    queryClient,
    baseUrl: import.meta.env.VITE_API_BASE_URL,
  })
}

const APIProvider = ({
  children,
  queryClient,
}: {
  children: React.ReactNode
  queryClient: QueryClient
}) => {
  const api = useMemo(() => createApiClientInstance(queryClient), [queryClient])

  return <APIContext.Provider value={{ api }}>{children}</APIContext.Provider>
}

const useAPI = () => {
  const context = useContext(APIContext)
  if (!context) {
    throw new Error('useAPI must be used within an APIProvider')
  }
  return context
}

export { APIProvider, useAPI }
