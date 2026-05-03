import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getMe, login as loginRequest, logout as logoutRequest } from '../api/authApi'
import { TOKEN_STORAGE_KEY } from '../api/axios'

const initialState = {
  user: null,
  tenant: null,
  token: null,
  isAuthenticated: false,
  isImpersonating: false,
  originalToken: null,
}

const getAuthPayload = (response) => response?.data ?? response ?? {}

const getTokenFromPayload = (payload) =>
  payload?.token ?? payload?.access_token ?? payload?.accessToken ?? null

export const useAuthStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      login: async (credentials) => {
        const response = await loginRequest(credentials)
        const payload = getAuthPayload(response)
        const token = getTokenFromPayload(payload)

        if (token) {
          localStorage.setItem(TOKEN_STORAGE_KEY, token)
        }

        set({
          user: payload.user ?? null,
          tenant: payload.tenant ?? null,
          token,
          isAuthenticated: Boolean(token),
        })

        return response
      },

      logout: async () => {
        try {
          await logoutRequest()
        } catch {
          // Logout should always clear local state, even if the API call fails.
        } finally {
          localStorage.removeItem(TOKEN_STORAGE_KEY)
          set({ ...initialState })
        }
      },

      loadUser: async () => {
        const token = localStorage.getItem(TOKEN_STORAGE_KEY) ?? get().token

        if (!token) {
          set({
            user: null,
            tenant: null,
            token: null,
            isAuthenticated: false,
          })
          return null
        }

        localStorage.setItem(TOKEN_STORAGE_KEY, token)

        try {
          const response = await getMe()
          const payload = getAuthPayload(response)

          set({
            user: payload.user ?? null,
            tenant: payload.tenant ?? null,
            token,
            isAuthenticated: true,
          })

          return response
        } catch (error) {
          if (error?.response?.status === 401) {
            localStorage.removeItem(TOKEN_STORAGE_KEY)
            set({
              user: null,
              tenant: null,
              token: null,
              isAuthenticated: false,
            })
            return null
          }

          throw error
        }
      },

      updateTenant: (data) => {
        set((state) => ({
          tenant: {
            ...(state.tenant ?? {}),
            ...data,
          },
        }))
      },

      updateUser: (data) => {
        set((state) => ({
          user: {
            ...(state.user ?? {}),
            ...data,
          },
        }))
      },

      startImpersonation: async (token, tenantName) => {
        const originalToken =
          get().originalToken ?? get().token ?? localStorage.getItem(TOKEN_STORAGE_KEY)

        set({
          originalToken,
          token,
          tenant: tenantName
            ? {
                ...(get().tenant ?? {}),
                business_name: tenantName,
              }
            : get().tenant,
        })
        localStorage.setItem(TOKEN_STORAGE_KEY, token)

        await get().loadUser()
        set({ isImpersonating: true })
      },

      stopImpersonation: async () => {
        const originalToken = get().originalToken

        if (!originalToken) {
          localStorage.removeItem(TOKEN_STORAGE_KEY)
          set({
            ...initialState,
          })
          return null
        }

        localStorage.setItem(TOKEN_STORAGE_KEY, originalToken)
        set({
          token: originalToken,
          originalToken: null,
          isImpersonating: false,
        })

        return get().loadUser()
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        originalToken: state.originalToken,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          localStorage.setItem(TOKEN_STORAGE_KEY, state.token)
        }
      },
    },
  ),
)
