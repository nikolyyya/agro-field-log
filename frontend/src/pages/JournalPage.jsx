// frontend/src/pages/JournalPage.jsx
import React, { useState, useEffect } from 'react';
import { getWorkEntries, getFields, getSeasons } from '../api/journal';

const JournalPage = () => {
  const [entries, setEntries] = useState([]);
  const [fields, setFields] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ field: '', season: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const [entriesData, fieldsData, seasonsData] = await Promise.all([
          getWorkEntries(filters),
          getFields(),
          getSeasons(),
        ]);
        
        setEntries(entriesData.results || entriesData); 
        setFields(fieldsData);
        setSeasons(seasonsData);
      } catch (err) {
        setError(err.detail || 'Не удалось загрузить данные');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [filters]);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleResetFilters = () => {
    setFilters({ field: '', season: '' });
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>⏳ Загрузка журнала...</div>;
  }

  if (error) {
    return <div style={{ color: 'red', textAlign: 'center', padding: '50px' }}>❌ {error}</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Журнал полевых работ</h2>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <select 
          value={filters.field} 
          onChange={(e) => handleFilterChange('field', e.target.value)}
          style={{ padding: '8px' }}
        >
          <option value="">Все поля</option>
          {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>

        <select 
          value={filters.season} 
          onChange={(e) => handleFilterChange('season', e.target.value)}
          style={{ padding: '8px' }}
        >
          <option value="">Все сезоны</option>
          {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <button onClick={handleResetFilters} style={{ padding: '8px 16px' }}>
          Сбросить
        </button>
      </div>

      {entries.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#666' }}>📭 Записей не найдено</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f4f4f4' }}>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Дата</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Поле</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Сезон</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Работа</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Затраты</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Примечание</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(entry => (
              <tr key={entry.id}>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{entry.work_date}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{entry.field_name || entry.planting?.field_name}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{entry.season_name || entry.planting?.season_name}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{entry.title}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{entry.cost} руб.</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{entry.notes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default JournalPage;