import axiosInstance from './axios'

export const hallsApi = {
  list: () => axiosInstance.get('/halls'),
}
