/**
 * Register Component
 * 
 * Allows new users to create an account.
 */

import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AuthError } from '../services/auth';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }

    // Validate password length
    if (password.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen lang sein');
      return;
    }

    setLoading(true);

    try {
      await register({ email, password, role: 'customer' });
      navigate('/documents');
    } catch (err) {
      const errorMessage = err instanceof AuthError 
        ? err.message 
        : 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Registrieren</h1>
        <p className="auth-subtitle">Erstellen Sie ein Konto für das Kundenportal</p>
        
        {error && <div className="error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">E-Mail</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="ihre@email.de"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Passwort</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="Mindestens 8 Zeichen"
              minLength={8}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Passwort bestätigen</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="Passwort wiederholen"
              minLength={8}
            />
          </div>
          
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Registrieren...' : 'Registrieren'}
          </button>
        </form>
        
        <p className="auth-footer">
          Bereits ein Konto? <Link to="/login">Jetzt anmelden</Link>
        </p>
      </div>
    </div>
  );
}
