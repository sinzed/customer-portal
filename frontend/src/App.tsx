import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import Documents from './components/Documents';
import Cases from './components/Cases';
import CreateCase from './components/CreateCase';
import './App.css';

/**
 * Main App Component
 * 
 * Sets up routing and navigation for the customer portal.
 */
function App() {
  return (
    <Router>
      <div className="app">
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/documents" replace />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/cases" element={<Cases />} />
            <Route path="/create-case" element={<CreateCase />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
