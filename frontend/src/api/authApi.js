import axiosInstance from './axios'

export const authApi = {
  login: (payload) => axiosInstance.post('/auth/login', payload),
}
