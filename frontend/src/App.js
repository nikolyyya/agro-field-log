// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import JournalPage from './pages/JournalPage';
import { logout } from './api/auth';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    logout();
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div style={{ padding: '20px' }}>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        borderBottom: '1px solid #eee', 
        paddingBottom: '10px' 
      }}>
        <h1>Журнал полевых работ</h1>
        <button 
          onClick={handleLogout} 
          style={{ 
            padding: '8px 16px', 
            background: '#dc3545', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer' 
          }}
        >
          Выйти
        </button>
      </header>
      
      <main style={{ marginTop: '20px' }}>
        <JournalPage /> 
      </main>
    </div>
  );
}

export default App;