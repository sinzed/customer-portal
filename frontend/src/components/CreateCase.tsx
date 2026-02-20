import { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../services/api';

/**
 * Create Case Form Component
 * 
 * Form for creating new cases/tickets.
 * Includes client-side validation and error handling.
 * In production, this would include:
 * - Rich text editor for description
 * - File attachments
 * - Case type selection
 * - Priority selection
 */
interface FormData {
  subject: string;
  description: string;
}

interface FormErrors {
  subject?: string;
  description?: string;
}

type SubmitStatus = 'success' | 'error' | null;

export default function CreateCase() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    subject: '',
    description: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    
    // Enforce 500 character limit for description
    if (name === 'description' && value.length > 500) {
      return;
    }
    
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    setSubmitStatus(null);
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.subject || !formData.subject.trim()) {
      newErrors.subject = 'Betreff ist erforderlich';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setSubmitting(true);
    setSubmitStatus(null);
    setErrorMessage(null);

    try {
      const result = await api.createCase({
        subject: formData.subject.trim(),
        description: formData.description.trim() || undefined,
      });

      setSubmitStatus('success');
      setFormData({ subject: '', description: '' });
      
      // Redirect to cases list after 2 seconds to show the new case
      setTimeout(() => {
        navigate('/cases', { state: { refreshCases: true } });
      }, 2000);
    } catch (err) {
      setSubmitStatus('error');
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Fehler beim Erstellen des Tickets. Bitte versuchen Sie es erneut.');
      }
      console.error('Error creating case:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container">
      <h1>Neues Ticket erstellen</h1>
      
      <form onSubmit={handleSubmit} className="case-form">
        <div className="form-group">
          <label htmlFor="subject">
            Betreff <span className="required">*</span>
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className={errors.subject ? 'error' : ''}
            placeholder="Kurze Beschreibung des Anliegens"
            disabled={submitting}
          />
          {errors.subject && (
            <span className="error-message">{errors.subject}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="description">Beschreibung (optional)</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={6}
            placeholder="Detaillierte Beschreibung des Anliegens"
            disabled={submitting}
            className=""
            maxLength={500}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
            <span style={{ 
              fontSize: '0.875rem', 
              color: formData.description.length > 450 ? '#dc3545' : '#6c757d',
              fontWeight: formData.description.length > 450 ? '500' : 'normal'
            }}>
              {formData.description.length} / 500 Zeichen
            </span>
          </div>
        </div>

        {submitStatus === 'success' && (
          <div className="success-message">
            ✓ Ticket erfolgreich erstellt! Sie werden zur Ticket-Übersicht weitergeleitet...
          </div>
        )}

        {submitStatus === 'error' && (
          <div className="error-message">
            ✗ {errorMessage || 'Fehler beim Erstellen des Tickets. Bitte versuchen Sie es erneut.'}
          </div>
        )}

        <button
          type="submit"
          className="btn-submit"
          disabled={submitting || !formData.subject.trim()}
        >
          {submitting ? 'Wird gesendet...' : 'Ticket erstellen'}
        </button>
      </form>
    </div>
  );
}
