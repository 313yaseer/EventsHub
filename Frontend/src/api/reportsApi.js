import axiosInstance from './axios'

export const reportsApi = {
  get: () => axiosInstance.get('/reports'),
}
