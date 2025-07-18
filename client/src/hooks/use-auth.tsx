
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  username: string
  firstName?: string
  lastName?: string
  email?: string
  department?: string
  isAdmin?: boolean
}

interface AuthContextType {
  user: User | null
  login: (user: User) => void
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // First, try to get user from localStorage
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser)
            setUser(userData)
            setLoading(false)
            
            // Still check with server in background, but don't block the UI
            fetch('/api/me', {
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json'
              }
            })
            .then(response => {
              if (!response.ok && response.status === 401) {
                // Only clear if we get a clear 401 from server
                setUser(null)
                localStorage.removeItem('user')
              }
            })
            .catch(error => {
              console.log('Background auth check failed, keeping stored user:', error)
              // Don't clear user on network errors
            })
            
            return
          } catch (error) {
            console.error('Error parsing stored user data:', error)
            localStorage.removeItem('user')
          }
        }

        // If no stored user, check with server
        const response = await fetch('/api/me', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const userData = await response.json()
          console.log('Auth check - received user data:', userData)
          setUser(userData)
          // Store user data in localStorage
          localStorage.setItem('user', JSON.stringify(userData))
        } else if (response.status === 401) {
          // User is not authenticated, clear any stale data
          setUser(null)
          localStorage.removeItem('user')
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        // Don't clear user data on network errors if we have stored user
        const storedUser = localStorage.getItem('user')
        if (!storedUser) {
          setUser(null)
        }
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = (userData: User) => {
    console.log('Login - storing user data:', userData)
    setUser(userData)
    // Store user data in localStorage
    localStorage.setItem('user', JSON.stringify(userData))
    setLoading(false)
  }

  const logout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
    } catch (error) {
      console.error('Logout failed:', error)
    }
    console.log('Logout - clearing user data')
    setUser(null)
    // Clear user data from localStorage
    localStorage.removeItem('user')
  }

  const contextValue: AuthContextType = {
    user,
    login,
    logout,
    loading
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
