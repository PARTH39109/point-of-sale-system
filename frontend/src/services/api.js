import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// ── Request Interceptor: attach JWT ───────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pos_jwt')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response Interceptor: handle 401 ─────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('pos_jwt')
      localStorage.removeItem('pos_user')
      window.location.href = '/login?reason=session_expired'
    } else if (error.response?.status === 500 && error.response.data?.message?.includes('limit')) {
      alert(`Limit Exceeded: ${error.response.data.message}`)
    }
    return Promise.reject(error)
  }
)

export default api
