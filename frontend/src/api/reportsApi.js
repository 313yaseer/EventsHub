import axiosInstance from './axios'

export const getDashboardStats = () => axiosInstance.get('/reports/dashboard')

export const getBookingReport = (params) => axiosInstance.get('/reports/bookings', { params })

export const getEventReport = (params) => axiosInstance.get('/reports/events', { params })

export const getAttendeeReport = (params) => axiosInstance.get('/reports/attendees', { params })

export const getRevenueReport = (params) => axiosInstance.get('/reports/revenue', { params })
