import axiosInstance from './axios'

export const settingsApi = {
  get: () => axiosInstance.get('/settings'),
}
