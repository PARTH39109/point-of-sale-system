import { createSlice } from '@reduxjs/toolkit'

const TOKEN_KEY = 'pos_jwt'
const USER_KEY  = 'pos_user'

function loadFromStorage() {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    const user  = JSON.parse(localStorage.getItem(USER_KEY) || 'null')
    return { token, user, isAuthenticated: !!token }
  } catch {
    return { token: null, user: null, isAuthenticated: false }
  }
}

const initialState = {
  ...loadFromStorage(),
  loading: false,
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart(state) {
      state.loading = true
      state.error   = null
    },
    loginSuccess(state, action) {
      const { jwt, user } = action.payload
      state.token           = jwt
      state.user            = user
      state.isAuthenticated = true
      state.loading         = false
      state.error           = null
      localStorage.setItem(TOKEN_KEY, jwt)
      localStorage.setItem(USER_KEY,  JSON.stringify(user))
    },
    loginFailure(state, action) {
      state.loading = false
      state.error   = action.payload
    },
    logout(state) {
      state.token           = null
      state.user            = null
      state.isAuthenticated = false
      state.loading         = false
      state.error           = null
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    },
    updateUser(state, action) {
      state.user = { ...state.user, ...action.payload }
      localStorage.setItem(USER_KEY, JSON.stringify(state.user))
    },
    clearError(state) {
      state.error = null
    },
  },
})

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateUser,
  clearError,
} = authSlice.actions

// Selectors
export const selectAuth            = (s) => s.auth
export const selectUser            = (s) => s.auth.user
export const selectToken           = (s) => s.auth.token
export const selectIsAuthenticated = (s) => s.auth.isAuthenticated
export const selectAuthLoading     = (s) => s.auth.loading
export const selectAuthError       = (s) => s.auth.error

export default authSlice.reducer
