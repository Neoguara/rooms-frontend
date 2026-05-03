import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { useAPI } from '@/hooks/use-api'

export type UserRole = "ADMIN" | "USER"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
}

export interface AuthContextType {
  user: User | null
  isLoading: boolean
  isLogged: () => boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType>(null!)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { api } = useAPI()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loginMutation = api.auth.login.useMutation()

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    const userData = localStorage.getItem('auth_user')
    if (token && userData) {
      try {
        setUser(JSON.parse(userData))
      } catch {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      try {
        const result = await loginMutation.mutateAsync({ body: { email, password } })
        const token = (result as { token?: string })?.token
        if (token) {
          localStorage.setItem('auth_token', token)
          let userData: User
          try {


            const payload = result

            userData = {
              id: payload.id || email,
              name: payload.name || email,
              email: payload.email || email,
              role: (payload.role as UserRole) || 'USER',
            }
          } catch {
            userData = { id: email, name: email, email, role: 'USER' }
          }
          localStorage.setItem('auth_user', JSON.stringify(userData))
          setUser(userData)
          return true
        }
        return false
      } catch {
        return false
      }
    },
    [loginMutation],
  )

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    setUser(null)
  }, [])

  const isLogged = useCallback(() => {
    const tokenLogged = localStorage.getItem('auth_token')
    const userDataLogged = localStorage.getItem('auth_user')
    
    let userLogged = null
    
    if (tokenLogged && userDataLogged) {
      try {
        userLogged = (JSON.parse(userDataLogged))
      } catch {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
      }
    }

    return userLogged !== null
    
  }, [])

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isLogged,
      login,
      logout,
    }),
    [user, isLoading, isLogged, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
