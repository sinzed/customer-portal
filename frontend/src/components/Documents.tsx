import { useState, useEffect } from 'react';
import { api, ApiError } from '../services/api';
import type { Document } from '../types/api';

/**
 * Documents View Component
 * 
 * Displays a list of customer documents with download functionality.
 * In production, this would include:
 * - Pagination for large document lists
 * - Filtering and search
 * - Document preview
 * - Upload functionality
 */
export default function Documents() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getDocuments();
      setDocuments(data.documents || []);
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Failed to load documents';
      setError(errorMessage);
      console.error('Error loading documents:', err);
    } finally {
      setLoading(false);
    }
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
        throw new Error(`Download fehlgeschlagen: ${response.status} ${response.statusText}`);
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
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';
      alert(`Fehler beim Herunterladen des Dokuments: ${errorMessage}. Bitte versuchen Sie es erneut.`);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <h1>Dokumente</h1>
        <p>Lade Dokumente...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <h1>Dokumente</h1>
        <div className="error">Fehler: {error}</div>
        <button onClick={loadDocuments}>Erneut versuchen</button>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1>Dokumente {documents.length > 0 && <span style={{ fontSize: '1rem', color: '#6c757d', fontWeight: 'normal' }}>({documents.length})</span>}</h1>
        {documents.length > 0 && (
          <button onClick={loadDocuments} className="btn-secondary" style={{ marginRight: '0.5rem' }}>
            Aktualisieren
          </button>
        )}
      </div>
      
      {documents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Keine Dokumente vorhanden.</p>
        </div>
      ) : (
        <div className="document-list">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Typ</th>
                <th>Erstellt am</th>
                <th>Aktion</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.document_id}>
                  <td><strong>{doc.name}</strong></td>
                  <td>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '12px', 
                      backgroundColor: '#e9ecef', 
                      color: '#495057',
                      fontSize: '0.85rem',
                      fontWeight: '500'
                    }}>
                      {doc.type}
                    </span>
                  </td>
                  <td>
                    {doc.created_date
                      ? new Date(doc.created_date).toLocaleDateString('de-DE', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-'}
                  </td>
                  <td>
                    <button
                      onClick={() => handleDownload(doc)}
                      className="btn-download"
                    >
                      Herunterladen
                    </button>
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
