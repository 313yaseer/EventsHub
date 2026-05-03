import axiosInstance from './axios'

export const bookingsApi = {
  list: () => axiosInstance.get('/bookings'),
}
