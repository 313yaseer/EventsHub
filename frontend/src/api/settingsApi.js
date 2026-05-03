import axiosInstance from './axios'

export const getSettings = () => axiosInstance.get('/settings')

export const updateBusiness = (data) => axiosInstance.put('/settings/business', data)

export const uploadLogo = (data) => axiosInstance.post('/settings/logo', data)

export const updateBranding = (data) => axiosInstance.put('/settings/branding', data)

export const updateProfile = (data) => axiosInstance.put('/settings/profile', data)

export const changePassword = (data) => axiosInstance.put('/settings/password', data)

export const getTeam = () => axiosInstance.get('/settings/team')

export const inviteMember = (data) => axiosInstance.post('/settings/team/invite', data)

export const acceptInvitation = (data) => axiosInstance.post('/settings/team/accept', data)

export const updateMember = (userId, data) => axiosInstance.put(`/settings/team/${userId}`, data)

export const removeMember = (userId) => axiosInstance.delete(`/settings/team/${userId}`)

export const updateNotifications = (data) => axiosInstance.put('/settings/notifications', data)
