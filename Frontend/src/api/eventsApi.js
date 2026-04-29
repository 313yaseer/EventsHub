import axiosInstance from './axios'

export const eventsApi = {
  list: () => axiosInstance.get('/events'),
}
