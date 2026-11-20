import { Navigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectIsAuthenticated, selectUser } from '../store/slices/authSlice'

// Role constants matching backend UserRole enum
export const ROLES = {
  ADMIN:          'ROLE_ADMIN',
  STORE_ADMIN:    'ROLE_STORE_ADMIN',
  BRANCH_MANAGER: 'ROLE_BRANCH_MANAGER',
  STORE_MANAGER:  'ROLE_STORE_MANAGER',
  CASHIER:        'ROLE_CASHIER',
}

/**
 * ProtectedRoute — wraps any route requiring authentication.
 * Optionally restricts by allowed roles.
 */
export function ProtectedRoute({ children, allowedRoles = [] }) {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const user            = useSelector(selectUser)
  const location        = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}

/**
 * RoleRouter — redirects users to their appropriate dashboard based on role.
 */
export function RoleRouter() {
  const user = useSelector(selectUser)

  switch (user?.role) {
    case ROLES.ADMIN:
    case ROLES.STORE_ADMIN:
      return <Navigate to="/admin/dashboard" replace />

    case ROLES.BRANCH_MANAGER:
    case ROLES.STORE_MANAGER:
      return <Navigate to="/manager/dashboard" replace />

    case ROLES.CASHIER:
      return <Navigate to="/cashier" replace />

    default:
      return <Navigate to="/login" replace />
  }
}

/**
 * PublicRoute — redirects already-authenticated users away from login/register.
 */
export function PublicRoute({ children }) {
  const isAuthenticated = useSelector(selectIsAuthenticated)

  if (isAuthenticated) {
    return <RoleRouter />
  }

  return children
}
