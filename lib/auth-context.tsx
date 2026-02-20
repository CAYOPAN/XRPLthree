"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"

export type Role = "TREASURY" | "VERIFIER" | "VIEWER"

interface AuthState {
  token: string | null
  address: string | null
  role: Role | null
  isAuthenticated: boolean
}

interface AuthContextValue extends AuthState {
  login: (token: string, address: string, role: Role) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    token: null,
    address: null,
    role: null,
    isAuthenticated: false,
  })

  useEffect(() => {
    const token = localStorage.getItem("xrpl_token")
    const address = localStorage.getItem("xrpl_address")
    const role = localStorage.getItem("xrpl_role") as Role | null

    if (token && address && role) {
      setAuth({ token, address, role, isAuthenticated: true })
    }
  }, [])

  const login = useCallback((token: string, address: string, role: Role) => {
    localStorage.setItem("xrpl_token", token)
    localStorage.setItem("xrpl_address", address)
    localStorage.setItem("xrpl_role", role)
    setAuth({ token, address, role, isAuthenticated: true })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem("xrpl_token")
    localStorage.removeItem("xrpl_address")
    localStorage.removeItem("xrpl_role")
    setAuth({ token: null, address: null, role: null, isAuthenticated: false })
  }, [])

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
