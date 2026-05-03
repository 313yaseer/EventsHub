import axiosInstance from './axios'

export const getEvents = (params) => axiosInstance.get('/events', { params })

export const getEventById = (id) => axiosInstance.get(`/events/${id}`)

export const getCalendarEvents = (from, to) =>
  axiosInstance.get('/events/calendar', { params: { from, to } })

export const updateEventStatus = (id, status) =>
  axiosInstance.patch(`/events/${id}/status`, { status })
