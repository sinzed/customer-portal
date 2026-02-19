import { useState, useEffect } from 'react';
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
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getCases();
      setCases(data.cases || []);
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
      <h1>Tickets / Cases</h1>
      
      {cases.length === 0 ? (
        <p>Keine Tickets vorhanden.</p>
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
