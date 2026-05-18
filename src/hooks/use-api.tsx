import { requestFn as baseRequestFn } from '@openapi-qraft/react'
import { createContext, useContext, useMemo } from 'react'
import type { QueryClient } from '@tanstack/react-query'
import { createAPIClient } from '#/api'

const APIContext = createContext<{
  api: ReturnType<typeof createApiClientInstance>
}>(null!)

const authRequestFn: typeof baseRequestFn = async <TData, TError>(
  schema: Parameters<typeof baseRequestFn>[0],
  options: Parameters<typeof baseRequestFn>[1],
) => {
  const token = localStorage.getItem('auth_token')
  const result = await baseRequestFn<TData, TError>(schema, {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if ('error' in result && !(result.error instanceof Error)) {
    const raw = result.error as Record<string, unknown>
    const message = typeof raw?.message === 'string' ? raw.message : 'API Error'
    const error = Object.assign(new Error(message), { cause: raw }) as typeof result.error
    return { response: result.response, error } as Awaited<ReturnType<typeof baseRequestFn<TData, TError>>>
  }
  return result
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
