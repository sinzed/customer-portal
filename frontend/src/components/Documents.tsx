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
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadError(null);
      setUploadSuccess(false);
    }
  };

  const handleUpload = async (): Promise<void> => {
    if (!selectedFile) {
      setUploadError('Bitte wählen Sie eine Datei aus.');
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);
      setUploadSuccess(false);

      // Determine document type from file extension
      const fileExt = selectedFile.name.split('.').pop()?.toLowerCase();
      let documentType = 'Document';
      if (fileExt === 'pdf') {
        documentType = 'PDF';
      } else if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExt || '')) {
        documentType = 'Image';
      } else if (['doc', 'docx'].includes(fileExt || '')) {
        documentType = 'Word Document';
      } else if (['xls', 'xlsx'].includes(fileExt || '')) {
        documentType = 'Spreadsheet';
      }

      await api.uploadDocument(selectedFile, documentType);
      
      setUploadSuccess(true);
      setSelectedFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

      // Reload documents list to show the new document
      await loadDocuments();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setUploadSuccess(false);
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : 'Fehler beim Hochladen des Dokuments. Bitte versuchen Sie es erneut.';
      setUploadError(errorMessage);
      console.error('Error uploading document:', err);
    } finally {
      setUploading(false);
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
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {documents.length > 0 && (
            <button onClick={loadDocuments} className="btn-secondary">
              Aktualisieren
            </button>
          )}
        </div>
      </div>

      {/* Upload Section */}
      <div style={{ 
        marginBottom: '2rem', 
        padding: '1.5rem', 
        border: '1px solid #dee2e6', 
        borderRadius: '8px',
        backgroundColor: '#f8f9fa'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.25rem' }}>Dokument hochladen</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label htmlFor="file-input" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Datei auswählen
              </label>
              <input
                id="file-input"
                type="file"
                onChange={handleFileSelect}
                disabled={uploading}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '0.95rem'
                }}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
              />
              {selectedFile && (
                <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#6c757d' }}>
                  Ausgewählt: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="btn-primary"
              style={{ 
                padding: '0.5rem 1.5rem',
                whiteSpace: 'nowrap',
                opacity: (!selectedFile || uploading) ? 0.6 : 1,
                cursor: (!selectedFile || uploading) ? 'not-allowed' : 'pointer'
              }}
            >
              {uploading ? 'Wird hochgeladen...' : 'Hochladen'}
            </button>
          </div>

          {uploadSuccess && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: '#d4edda',
              color: '#155724',
              borderRadius: '4px',
              border: '1px solid #c3e6cb'
            }}>
              ✓ Dokument erfolgreich hochgeladen und zu Salesforce synchronisiert!
            </div>
          )}

          {uploadError && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: '#f8d7da',
              color: '#721c24',
              borderRadius: '4px',
              border: '1px solid #f5c6cb'
            }}>
              ✗ {uploadError}
            </div>
          )}
        </div>
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
