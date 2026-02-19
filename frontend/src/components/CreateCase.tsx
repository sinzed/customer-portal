import { useState, FormEvent, ChangeEvent } from 'react';
import { api } from '../services/api';

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
}

type SubmitStatus = 'success' | 'error' | null;

export default function CreateCase() {
  const [formData, setFormData] = useState<FormData>({
    subject: '',
    description: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
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

    try {
      const result = await api.createCase({
        subject: formData.subject.trim(),
        description: formData.description.trim() || undefined,
      });

      setSubmitStatus('success');
      setFormData({ subject: '', description: '' });
      
      // In production, we might redirect or refresh the cases list
      console.log('Case created:', result);
    } catch (err) {
      setSubmitStatus('error');
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
          />
        </div>

        {submitStatus === 'success' && (
          <div className="success-message">
            ✓ Ticket erfolgreich erstellt!
          </div>
        )}

        {submitStatus === 'error' && (
          <div className="error-message">
            ✗ Fehler beim Erstellen des Tickets. Bitte versuchen Sie es erneut.
          </div>
        )}

        <button
          type="submit"
          className="btn-submit"
          disabled={submitting}
        >
          {submitting ? 'Wird gesendet...' : 'Ticket erstellen'}
        </button>
      </form>
    </div>
  );
}
