/**
 * Sidebar navigation for Nena na Daktari.
 *
 * Persistent left sidebar with branding, navigation, and user info.
 * Collapses on smaller screens.
 */

import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  UsersRound,
  Stethoscope,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  User,
} from 'lucide-react';
import authService from '../services/authService';
import { User as UserType } from '../types';

interface SidebarProps {
  user: UserType | null;
}

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/patients', label: 'Patients', icon: UsersRound },
  { to: '/consultations', label: 'Consultations', icon: Stethoscope },
];

const Sidebar: React.FC<SidebarProps> = ({ user }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  const closeMobile = () => setMobileOpen(false);

  const sidebarContent = (
    <>
      {/* Branding */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <Stethoscope size={22} strokeWidth={2} />
        </div>
        {!collapsed && (
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">Nena na Daktari</span>
            <span className="sidebar-brand-subtitle">Clinical Workspace</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav" role="navigation" aria-label="Main navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? 'sidebar-nav-item-active' : ''}`
            }
            onClick={closeMobile}
            title={collapsed ? item.label : undefined}
          >
            <item.icon size={18} strokeWidth={1.8} />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* User section */}
      <div className="sidebar-user">
        {!collapsed && user && (
          <div className="sidebar-user-info">
            <div className="sidebar-user-avatar">
              <User size={16} strokeWidth={1.8} />
            </div>
            <div className="sidebar-user-details">
              <span className="sidebar-user-name">
                {user.full_name || user.username}
              </span>
              <span className="sidebar-user-role">
                {user.role === 'doctor' ? 'Doctor' : 'Admin'}
              </span>
            </div>
          </div>
        )}
        <button
          className="sidebar-nav-item"
          onClick={handleLogout}
          title={collapsed ? 'Sign out' : undefined}
          aria-label="Sign out"
        >
          <LogOut size={18} strokeWidth={1.8} />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="sidebar-mobile-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle navigation"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={closeMobile} aria-hidden="true" />
      )}

      {/* Desktop sidebar */}
      <aside
        className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}
        aria-label="Application sidebar"
      >
        {/* Collapse toggle (desktop only) */}
        <button
          className="sidebar-collapse-toggle"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft
            size={16}
            style={{
              transform: collapsed ? 'rotate(180deg)' : 'none',
              transition: 'transform var(--transition-base)',
            }}
          />
        </button>

        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={`sidebar sidebar-mobile ${mobileOpen ? 'sidebar-mobile-open' : ''}`}
        aria-label="Application navigation"
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;
