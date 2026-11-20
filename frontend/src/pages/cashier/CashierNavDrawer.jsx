import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { selectUser, logout } from '../../store/slices/authSlice';
import {
    X, Monitor, History, RotateCcw, Users, Clock3, LogOut
} from 'lucide-react';

const NAV_ITEMS = [
    { to: '/cashier', label: 'POS Terminal', icon: Monitor, end: true },
    { to: '/cashier/orders', label: 'Order History', icon: History },
    { to: '/cashier/returns', label: 'Returns / Refunds', icon: RotateCcw },
    { to: '/cashier/customers', label: 'Customers', icon: Users },
    { to: '/cashier/shift', label: 'Shift Summary', icon: Clock3 },
];

/**
 * Slide-in navigation drawer shared by every cashier-facing page.
 * Controlled from the parent via `open` / `onClose`.
 */
const CashierNavDrawer = ({ open, onClose }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const user = useSelector(selectUser);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const initials = (user?.fullName || 'C')
        .split(' ')
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return (
        <>
            <div
                className={`cashier-drawer-scrim ${open ? 'is-open' : ''}`}
                onClick={onClose}
                aria-hidden="true"
            />
            <aside className={`cashier-drawer ${open ? 'is-open' : ''}`}>
                <div className="cashier-drawer-header">
                    <div className="pos-brand">
                        <div className="pos-brand-mark">POS</div>
                        <span className="pos-brand-title">Cashier Menu</span>
                    </div>
                    <button className="cashier-drawer-close" onClick={onClose} aria-label="Close menu">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="cashier-drawer-user">
                    <div className="cashier-drawer-avatar">{initials}</div>
                    <div style={{ minWidth: 0 }}>
                        <div className="cashier-drawer-user-name">{user?.fullName || 'Cashier'}</div>
                        <div className="cashier-drawer-user-role">Cashier</div>
                    </div>
                </div>

                <nav className="cashier-drawer-nav">
                    {NAV_ITEMS.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            onClick={onClose}
                            className={({ isActive }) => `cashier-drawer-link ${isActive ? 'active' : ''}`}
                        >
                            <item.icon className="w-4 h-4" />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="cashier-drawer-footer">
                    <button className="cashier-drawer-logout" onClick={handleLogout}>
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default CashierNavDrawer;