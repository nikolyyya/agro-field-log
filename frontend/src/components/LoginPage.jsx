// frontend/src/components/LoginPage.jsx
import React, { useState } from 'react';
import { login } from '../api/auth';

const LoginPage = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(username, password);
      localStorage.setItem('token', data.token); 
      onLoginSuccess(); 
    } catch (err) {
      if (err.non_field_errors) {
        setError(err.non_field_errors[0]);
      } else if (err.username || err.password) {
        setError('Неверный логин или пароль');
      } else {
        setError('Произошла ошибка. Попробуйте позже.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Вход в систему</h2>
      {error && (
        <div style={{ color: 'red', marginBottom: '15px', padding: '10px', background: '#ffe6e6', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Логин:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Пароль:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ width: '100%', padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;