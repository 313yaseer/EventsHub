import axiosInstance from './axios'

export const getPlatformStats = () => axiosInstance.get('/admin/stats')

export const getTenants = (params) => axiosInstance.get('/admin/tenants', { params })

export const getTenantDetail = (id) => axiosInstance.get(`/admin/tenants/${id}`)

export const updateTenantStatus = (id, data) =>
  axiosInstance.patch(`/admin/tenants/${id}/status`, data)

export const updateTenantPlan = (id, data) => axiosInstance.patch(`/admin/tenants/${id}/plan`, data)

export const impersonate = (tenantId) => axiosInstance.post(`/admin/impersonate/${tenantId}`)

export const getAuditLog = (params) => axiosInstance.get('/admin/audit', { params })
