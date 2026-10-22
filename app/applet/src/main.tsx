import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

function App() {
  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', background: '#0a1128', color: '#fff', minHeight: '100vh' }}>
      <h1>EthioLearn Pro</h1>
      <p>Welcome to EthioLearn Pro - Bilingual AI-powered study platform for Ethiopian university students.</p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
