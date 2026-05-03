import axiosInstance from './axios'

export const getClients = (params) => axiosInstance.get('/clients', { params })

export const getClientById = (id) => axiosInstance.get(`/clients/${id}`)

export const createClient = (data) => axiosInstance.post('/clients', data)

export const updateClient = (id, data) => axiosInstance.put(`/clients/${id}`, data)

export const deleteClient = (id) => axiosInstance.delete(`/clients/${id}`)
