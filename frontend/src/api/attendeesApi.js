import axiosInstance from './axios'

export const attendeesApi = {
  list: () => axiosInstance.get('/attendees'),
}
