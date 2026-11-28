// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import JournalPage from './pages/JournalPage';
import ReportPage from './pages/ReportPage'; 
import { logout } from './api/auth';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('journal'); 
  const userRole = 'agronom'; 

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
    setActiveTab('journal'); 
  };

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        borderBottom: '1px solid #eee', 
        paddingBottom: '15px',
        marginBottom: '20px'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>Журнал полевых работ</h1>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <nav style={{ display: 'flex', gap: '5px' }}>
            <button 
              onClick={() => setActiveTab('journal')}
              style={{ 
                padding: '8px 16px', 
                background: activeTab === 'journal' ? '#007bff' : '#f8f9fa', 
                color: activeTab === 'journal' ? 'white' : '#333',
                border: '1px solid #ddd', 
                borderRadius: '4px', 
                cursor: 'pointer' 
              }}
            >
              Журнал
            </button>
            {userRole === 'manager' && (
              <button 
                onClick={() => setActiveTab('report')}
                style={{ 
                  padding: '8px 16px', 
                  background: activeTab === 'report' ? '#007bff' : '#f8f9fa', 
                  color: activeTab === 'report' ? 'white' : '#333',
                  border: '1px solid #ddd', 
                  borderRadius: '4px', 
                  cursor: 'pointer' 
                }}
              >
                Отчет по затратам
              </button>
            )}
          </nav>

          <button 
            onClick={handleLogout} 
            style={{ 
              marginLeft: '20px',
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
        </div>
      </header>
      <main>
        {activeTab === 'journal' && (
          <JournalPage role={userRole} /> 
        )}
        
        {activeTab === 'report' && (
          <ReportPage />
        )}
      </main>
    </div>
  );
}

export default App;