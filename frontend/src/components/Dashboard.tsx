import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { Document, Case } from '../types/api';
import './Dashboard.css';

/**
 * Dashboard/Overview Component
 * 
 * Main dashboard page showing overview of documents, tickets, and appointments.
 * Matches the design from the provided image.
 */
export default function Dashboard() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const [documentsData, casesData] = await Promise.all([
        api.getDocuments(),
        api.getCases(),
      ]);
      setDocuments(documentsData.documents || []);
      setCases(casesData.cases || []);
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Failed to load dashboard data';
      setError(errorMessage);
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get user's first name for welcome message
  const getUserFirstName = (): string => {
    if (user?.email) {
      const name = user.email.split('@')[0];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return 'Max';
  };

  // Get customer number (using user_id as fallback)
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

  // Get recent documents (last 3)
  const recentDocuments = documents
    .sort((a, b) => {
      const dateA = a.created_date ? new Date(a.created_date).getTime() : 0;
      const dateB = b.created_date ? new Date(b.created_date).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 3);

  // Get active tickets (not closed)
  const activeTickets = cases
    .filter(c => c.status !== 'Closed')
    .sort((a, b) => {
      const dateA = new Date(a.created_date).getTime();
      const dateB = new Date(b.created_date).getTime();
      return dateB - dateA;
    })
    .slice(0, 2);

  // Mock appointments data (since there's no API endpoint yet)
  const appointments = [
    {
      id: '1',
      title: 'Beratung Wärmepumpe',
      date: '2026-02-20',
      time: '10:00',
      type: 'Beratung',
    },
    {
      id: '2',
      title: 'Installationstermin',
      date: '2026-02-25',
      time: '14:00',
      type: 'Service',
    },
  ];

  const getStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
      'New': 'Wartend',
      'In Progress': 'In Bearbeitung',
      'Closed': 'Geschlossen',
      'Escalated': 'Eskaliert',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string): string => {
    const colorMap: Record<string, string> = {
      'New': '#FFC107', // Yellow for "Wartend"
      'In Progress': '#2196F3', // Blue for "In Bearbeitung"
      'Closed': '#4CAF50',
      'Escalated': '#F44336',
    };
    return colorMap[status] || '#757575';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleDownload = async (doc: Document): Promise<void> => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        alert('Sie müssen angemeldet sein, um Dokumente herunterzuladen.');
        return;
      }

      const fullUrl = doc.download_url.startsWith('http') 
        ? doc.download_url 
        : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${doc.download_url}`;
      
      // Fetch the PDF with authentication
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Download failed:', response.status, errorText);
        throw new Error(`Download fehlgeschlagen: ${response.status}`);
      }

      // Get the blob and create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = doc.name;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading document:', err);
      alert(`Fehler beim Herunterladen des Dokuments: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}. Bitte versuchen Sie es erneut.`);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">Lade Dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-error">
          <p>Fehler: {error}</p>
          <button onClick={loadDashboardData} className="btn-retry">
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Welcome Section */}
      <div className="dashboard-welcome">
        <h1>Willkommen zurück, {getUserFirstName()}!</h1>
        <p>Hier ist Ihre Übersicht über alle wichtigen Aktivitäten.</p>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-card-icon documents-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 9H9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="summary-card-content">
            <h3>Dokumente</h3>
            <p className="summary-card-number">{documents.length}</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-card-icon tickets-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 9C2 7.89543 2.89543 7 4 7H20C21.1046 7 22 7.89543 22 9V10C20.8954 10 20 10.8954 20 12C20 13.1046 20.8954 14 22 14V15C22 16.1046 21.1046 17 20 17H4C2.89543 17 2 16.1046 2 15V14C3.10457 14 4 13.1046 4 12C4 10.8954 3.10457 10 2 10V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="summary-card-content">
            <h3>Offene Tickets</h3>
            <p className="summary-card-number">{activeTickets.length}</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-card-icon appointments-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="summary-card-content">
            <h3>Termine</h3>
            <p className="summary-card-number">{appointments.length}</p>
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="dashboard-content">
        {/* Current Documents Section */}
        <div className="dashboard-section">
          <div className="section-header">
            <div>
              <h2>Aktuelle Dokumente</h2>
              <p className="section-subtitle">Zuletzt hochgeladene und erhaltene Dateien</p>
            </div>
            <Link to="/documents" className="view-all-link">Alle ansehen</Link>
          </div>
          <div className="section-content">
            {recentDocuments.length === 0 ? (
              <p className="empty-state">Keine Dokumente vorhanden.</p>
            ) : (
              <div className="document-list">
                {recentDocuments.map((doc) => (
                  <div key={doc.document_id} className="document-item">
                    <div className="document-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="document-info">
                      <div className="document-name">{doc.name}</div>
                      <div className="document-meta">
                        {doc.type} • {doc.created_date ? formatDate(doc.created_date) : '-'}
                      </div>
                    </div>
                    <button className="btn-open" onClick={() => handleDownload(doc)}>
                      Öffnen
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button className="btn-upload">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 10L12 5L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 5V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Dokument hochladen
            </button>
          </div>
        </div>

        {/* Active Tickets Section */}
        <div className="dashboard-section">
          <div className="section-header">
            <div>
              <h2>Aktive Tickets</h2>
              <p className="section-subtitle">Ihre laufenden Anfragen und Meldungen</p>
            </div>
            <Link to="/cases" className="view-all-link">Alle ansehen</Link>
          </div>
          <div className="section-content">
            {activeTickets.length === 0 ? (
              <p className="empty-state">Keine aktiven Tickets vorhanden.</p>
            ) : (
              <div className="ticket-list">
                {activeTickets.map((ticket) => (
                  <div key={ticket.case_id} className="ticket-item">
                    <div className="ticket-info">
                      <div className="ticket-title">{ticket.subject}</div>
                      <div className="ticket-meta">
                        {ticket.case_id} • Erstellt am {formatDate(ticket.created_date)}
                      </div>
                    </div>
                    <div className="ticket-status" style={{ backgroundColor: getStatusColor(ticket.status) }}>
                      {ticket.status === 'In Progress' && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                          <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      )}
                      {ticket.status === 'New' && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      )}
                      {getStatusLabel(ticket.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link to="/create-case" className="btn-create-ticket">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 9C2 7.89543 2.89543 7 4 7H20C21.1046 7 22 7.89543 22 9V10C20.8954 10 20 10.8954 20 12C20 13.1046 20.8954 14 22 14V15C22 16.1046 21.1046 17 20 17H4C2.89543 17 2 16.1046 2 15V14C3.10457 14 4 13.1046 4 12C4 10.8954 3.10457 10 2 10V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Neues Ticket erstellen
            </Link>
          </div>
        </div>
      </div>

      {/* Upcoming Appointments Section */}
      <div className="dashboard-section full-width">
        <div className="section-header">
          <div>
            <h2>Anstehende Termine</h2>
            <p className="section-subtitle">Ihre geplanten Beratungs- und Servicetermine</p>
          </div>
          <Link to="/appointments" className="view-all-link">Alle ansehen</Link>
        </div>
        <div className="section-content">
          {appointments.length === 0 ? (
            <p className="empty-state">Keine Termine vorhanden.</p>
          ) : (
            <div className="appointment-list">
              {appointments.map((appointment) => (
                <div key={appointment.id} className="appointment-item">
                  <div className="appointment-date">
                    <div className="appointment-day">{new Date(appointment.date).getDate()}</div>
                    <div className="appointment-month">
                      {new Date(appointment.date).toLocaleDateString('de-DE', { month: 'short' })}
                    </div>
                  </div>
                  <div className="appointment-info">
                    <div className="appointment-title">{appointment.title}</div>
                    <div className="appointment-meta">
                      {appointment.time} Uhr • {appointment.type}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
