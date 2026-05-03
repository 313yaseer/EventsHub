import axiosInstance from './axios'

export const getPlans = () => axiosInstance.get('/billing/plans')

export const getBilling = () => axiosInstance.get('/billing')

export const createCheckout = (plan) => axiosInstance.post('/billing/checkout', { plan })

export const createPortal = () => axiosInstance.post('/billing/portal')

export const cancelSubscription = () => axiosInstance.post('/billing/cancel')
