import axiosInstance from './axios'

export const clientsApi = {
  list: () => axiosInstance.get('/clients'),
}
