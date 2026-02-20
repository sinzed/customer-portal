import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api, ApiError } from '../services/api';
import type { Case } from '../types/api';

/**
 * Cases View Component
 * 
 * Displays a list of customer cases/tickets with status information.
 * In production, this would include:
 * - Filtering by status
 * - Sorting options
 * - Case detail view
 * - Real-time updates
 */
export default function Cases() {
  const navigate = useNavigate();
  const location = useLocation();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCases();
  }, []);

  // Refresh cases when navigating back from create-case
  useEffect(() => {
    if (location.state?.refreshCases) {
      loadCases();
      // Clear the state to prevent unnecessary refreshes
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const loadCases = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getCases();
      // Sort cases by created_date descending (most recent first)
      const sortedCases = (data.cases || []).sort((a, b) => {
        const dateA = new Date(a.created_date).getTime();
        const dateB = new Date(b.created_date).getTime();
        return dateB - dateA; // Descending order (newest first)
      });
      setCases(sortedCases);
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Failed to load cases';
      setError(errorMessage);
      console.error('Error loading cases:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    const statusColors: Record<string, string> = {
      'New': '#2196F3',
      'In Progress': '#FF9800',
      'Closed': '#4CAF50',
      'Escalated': '#F44336',
      'eingehend': '#9C27B0', // Purple for incoming status
    };
    return statusColors[status] || '#757575';
  };

  if (loading) {
    return (
      <div className="container">
        <h1>Tickets / Cases</h1>
        <p>Lade Tickets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <h1>Tickets / Cases</h1>
        <div className="error">Fehler: {error}</div>
        <button onClick={loadCases}>Erneut versuchen</button>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1>Tickets / Cases</h1>
        <div>
          <button 
            onClick={() => navigate('/create-case')} 
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Neues Ticket erstellen
          </button>
        </div>
      </div>
      
      {cases.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Keine Tickets vorhanden.</p>
          <button 
            onClick={() => navigate('/create-case')} 
            className="btn-primary" 
            style={{ 
              marginTop: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              margin: '1rem auto 0'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Erstes Ticket erstellen
          </button>
        </div>
      ) : (
        <div className="cases-list">
          <table>
            <thead>
              <tr>
                <th>Betreff</th>
                <th>Typ</th>
                <th>Status</th>
                <th>Erstellt am</th>
                <th>Beschreibung</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((caseItem) => (
                <tr key={caseItem.case_id}>
                  <td><strong>{caseItem.subject}</strong></td>
                  <td>{caseItem.type || '-'}</td>
                  <td>
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(caseItem.status) }}
                    >
                      {caseItem.status}
                    </span>
                  </td>
                  <td>
                    {new Date(caseItem.created_date).toLocaleDateString('de-DE', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="description-cell">
                    {caseItem.description || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
