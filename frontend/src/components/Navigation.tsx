import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Navigation Component
 * 
 * Simple navigation bar for the customer portal.
 * In production, this would include:
 * - User profile/logout
 * - Notifications
 * - Breadcrumbs
 */
export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const isActive = (path: string): string => {
    return location.pathname === path ? 'active' : '';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Don't show navigation on login/register pages
  if (!isAuthenticated && (location.pathname === '/login' || location.pathname === '/register')) {
    return null;
  }

  return (
    <nav className="navigation">
      <div className="nav-container">
        <h2 className="nav-brand">Octopus Energy Kundenportal</h2>
        {isAuthenticated ? (
          <>
            <ul className="nav-links">
              <li>
                <Link to="/documents" className={isActive('/documents')}>
                  Dokumente
                </Link>
              </li>
              <li>
                <Link to="/cases" className={isActive('/cases')}>
                  Tickets
                </Link>
              </li>
              <li>
                <Link to="/create-case" className={isActive('/create-case')}>
                  Neues Ticket
                </Link>
              </li>
            </ul>
            <div className="nav-user">
              <span className="user-email">{user?.email}</span>
              <button onClick={handleLogout} className="btn-logout">
                Abmelden
              </button>
            </div>
          </>
        ) : (
          <ul className="nav-links">
            <li>
              <Link to="/login">Anmelden</Link>
            </li>
            <li>
              <Link to="/register">Registrieren</Link>
            </li>
          </ul>
        )}
      </div>
    </nav>
  );
}
