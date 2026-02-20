import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect, useRef } from 'react';
import './Navigation.css';

/**
 * Navigation Component
 * 
 * Navigation bar matching the design with logo, user info, and tab navigation.
 */
export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string): boolean => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    navigate('/login');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // Don't show navigation on login/register pages
  if (!isAuthenticated && (location.pathname === '/login' || location.pathname === '/register')) {
    return null;
  }

  // Get user's display name
  const getUserDisplayName = (): string => {
    if (user?.email) {
      const name = user.email.split('@')[0];
      const parts = name.split('.');
      if (parts.length >= 2) {
        return `${parts[0].charAt(0).toUpperCase() + parts[0].slice(1)} ${parts[1].charAt(0).toUpperCase() + parts[1].slice(1)}`;
      }
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return 'Max Mustermann';
  };

  // Get customer number
  const getCustomerNumber = (): string => {
    return user?.user_id?.slice(0, 8) || '12345678';
  };

  // Get user initials for avatar
  const getUserInitials = (): string => {
    if (user?.email) {
      const parts = user.email.split('@')[0].split('.');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'MM';
  };

  return (
    <>
      <nav className="navigation">
        <div className="nav-container">
          <div className="nav-brand-section">
            <div className="nav-logo">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="14" fill="#E91E63"/>
                <circle cx="12" cy="12" r="2" fill="white"/>
                <circle cx="20" cy="12" r="2" fill="white"/>
                <path d="M10 20C10 18 12 16 16 16C20 16 22 18 22 20" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <path d="M8 8L10 10M22 8L20 10M8 24L10 22M22 24L20 22" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="nav-brand-text">
              <div className="nav-brand-title">Octopus Energy</div>
              <div className="nav-brand-subtitle">Kundenportal</div>
            </div>
          </div>
          {isAuthenticated && (
            <div className="nav-user-section">
              <div className="nav-user-info">
                <div className="nav-user-name">{getUserDisplayName()}</div>
                <div className="nav-user-id">Kundennr: {getCustomerNumber()}</div>
              </div>
              <div className="nav-user-avatar-container" ref={dropdownRef}>
                <button
                  className="nav-user-avatar-button"
                  onClick={() => setShowDropdown(!showDropdown)}
                  aria-label="User menu"
                >
                  <div className="nav-user-avatar">
                    {getUserInitials()}
                  </div>
                </button>
                {showDropdown && (
                  <div className="nav-user-dropdown">
                    <div className="nav-user-dropdown-header">
                      <div className="nav-user-dropdown-name">{getUserDisplayName()}</div>
                      <div className="nav-user-dropdown-email">{user?.email || ''}</div>
                    </div>
                    <div className="nav-user-dropdown-divider"></div>
                    <button
                      className="nav-user-dropdown-item"
                      onClick={handleLogout}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Abmelden
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>
      {isAuthenticated && (
        <nav className="nav-tabs">
          <div className="nav-tabs-container">
            <Link to="/" className={`nav-tab ${isActive('/') && location.pathname === '/' ? 'active' : ''}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Übersicht
            </Link>
            <Link to="/documents" className={`nav-tab ${isActive('/documents') ? 'active' : ''}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Dokumente
            </Link>
            <Link to="/cases" className={`nav-tab ${isActive('/cases') ? 'active' : ''}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 9C2 7.89543 2.89543 7 4 7H20C21.1046 7 22 7.89543 22 9V10C20.8954 10 20 10.8954 20 12C20 13.1046 20.8954 14 22 14V15C22 16.1046 21.1046 17 20 17H4C2.89543 17 2 16.1046 2 15V14C3.10457 14 4 13.1046 4 12C4 10.8954 3.10457 10 2 10V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Tickets
            </Link>
            <Link to="/appointments" className={`nav-tab ${isActive('/appointments') ? 'active' : ''}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Termine
            </Link>
          </div>
        </nav>
      )}
    </>
  );
}
