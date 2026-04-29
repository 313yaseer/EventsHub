import axiosInstance from './axios'

export const adminApi = {
  overview: () => axiosInstance.get('/admin/overview'),
}
