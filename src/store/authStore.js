import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Parse JWT payload tanpa library tambahan
const parseJwt = (token) => {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))
  } catch {
    return null
  }
}

const isTokenValid = (token) => {
  if (!token) return false
  const payload = parseJwt(token)
  if (!payload?.exp) return false
  // Cek expiry dengan buffer 30 detik
  return payload.exp * 1000 > Date.now() + 30000
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken }),

      logout: () =>
        set({ user: null, accessToken: null, refreshToken: null }),

      isAuthenticated: () => isTokenValid(get().accessToken),

      updateToken: (accessToken) => set({ accessToken }),
    }),
    { name: 'erp-auth' }
  )
)
