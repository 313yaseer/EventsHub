import axiosInstance from './axios'

export const billingApi = {
  get: () => axiosInstance.get('/billing'),
}
