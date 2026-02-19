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

  const handleDownload = (document: Document): void => {
    // In production, this would trigger actual file download
    // For MVP, we simulate download
    alert(`Downloading: ${document.name}\n\nIn production, this would download from: ${document.download_url}`);
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
      <h1>Dokumente</h1>
      
      {documents.length === 0 ? (
        <p>Keine Dokumente vorhanden.</p>
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
                  <td>{doc.name}</td>
                  <td>{doc.type}</td>
                  <td>
                    {doc.created_date
                      ? new Date(doc.created_date).toLocaleDateString('de-DE')
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
