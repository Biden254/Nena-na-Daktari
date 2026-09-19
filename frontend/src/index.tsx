/**
 * React entry point for Nena na Daktari.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global styles
import './styles/index.css';
import './styles/auth.css';
import './styles/sidebar.css';
import './styles/dashboard.css';
import './styles/patients.css';
import './styles/patient-form.css';
import './styles/patient-detail.css';
import './styles/encounter.css';
import './styles/consultations.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
