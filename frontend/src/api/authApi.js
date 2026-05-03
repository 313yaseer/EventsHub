import axiosInstance from './axios'

export const signup = (data) => axiosInstance.post('/auth/signup', data)

export const login = (data) => axiosInstance.post('/auth/login', data)

export const logout = () => axiosInstance.post('/auth/logout')

export const getMe = () => axiosInstance.get('/auth/me')

export const verifyEmail = (token) => axiosInstance.get(`/auth/verify/${token}`)

export const resendVerification = (email) =>
  axiosInstance.post('/auth/resend-verification', { email })

export const forgotPassword = (email) => axiosInstance.post('/auth/forgot-password', { email })

export const resetPassword = (data) => axiosInstance.post('/auth/reset-password', data)

export const completeOnboarding = (data) => axiosInstance.put('/auth/onboarding', data)
