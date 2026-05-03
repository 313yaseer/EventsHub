import axiosInstance from './axios'

export const getHalls = () => axiosInstance.get('/halls')

export const createHall = (data) => axiosInstance.post('/halls', data)

export const updateHall = (id, data) => axiosInstance.put(`/halls/${id}`, data)

export const toggleHall = (id) => axiosInstance.patch(`/halls/${id}/toggle`)

export const deleteHall = (id) => axiosInstance.delete(`/halls/${id}`)
