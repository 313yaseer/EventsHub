import axiosInstance from './axios'

export const bulkCreateAttendees = (eventId, attendees) =>
  axiosInstance.post(`/events/${eventId}/attendees/bulk`, { attendees })

export const getEventAttendees = (eventId, params) =>
  axiosInstance.get(`/events/${eventId}/attendees`, { params })

export const getAttendeePass = (attendeeId) => axiosInstance.get(`/attendees/${attendeeId}/pass`)

export const deleteEventAttendees = (eventId) =>
  axiosInstance.delete(`/events/${eventId}/attendees`)

export const scanQR = (token) => axiosInstance.post(`/scan/${token}`)
