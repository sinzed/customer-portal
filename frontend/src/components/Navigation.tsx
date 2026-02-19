import { Link, useLocation } from 'react-router-dom';

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

  const isActive = (path: string): string => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <h2 className="nav-brand">Octopus Energy Kundenportal</h2>
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
      </div>
    </nav>
  );
}
