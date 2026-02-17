import React, { useState } from 'react';
import ErrorSubmissionForm from './components/ErrorSubmissionForm';
import EnvironmentStatus from './components/EnvironmentStatus';
import './App.css';

function App() {
  const [activeSection, setActiveSection] = useState('error-report');

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>API Error Logger</h1>
        <p className="app-subtitle">Report API errors and monitor environment status</p>
        
        {/* Navigation Menu */}
        <nav className="app-nav">
          <button
            className={`nav-button ${activeSection === 'error-report' ? 'active' : ''}`}
            onClick={() => scrollToSection('error-report')}
            aria-label="Navigate to Error Report section"
          >
            Report Error
          </button>
          <button
            className={`nav-button ${activeSection === 'environment-status' ? 'active' : ''}`}
            onClick={() => scrollToSection('environment-status')}
            aria-label="Navigate to Environment Status section"
          >
            Environment Status
          </button>
        </nav>
      </header>

      <main className="app-main">
        <section id="error-report" className="error-report-section">
          <ErrorSubmissionForm />
        </section>

        <section id="environment-status" className="environment-status-section">
          <h2>Environment Status</h2>
          <EnvironmentStatus />
        </section>
      </main>

      <footer className="app-footer">
        <p>&copy; 2024 API Error Logger</p>
      </footer>
    </div>
  );
}

export default App;
