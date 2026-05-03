import axios from 'axios'

export const TOKEN_STORAGE_KEY = 'token'

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  timeout: 15000,
})

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (!error.response) {
      throw new Error('Network error. Check connection.')
    }

    if (error.response.status === 401) {
      localStorage.removeItem(TOKEN_STORAGE_KEY)

      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    throw error
  },
)

export default axiosInstance
