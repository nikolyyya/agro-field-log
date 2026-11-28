
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ReportPage = () => {
  const [reportData, setReportData] = useState([]);
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
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Token ${token}` };
        const [reportRes, fieldsRes, seasonsRes] = await Promise.all([
          axios.get('/api/reports/costs/', { params: filters, headers }),
          axios.get('/api/fields/', { headers }),
          axios.get('/api/seasons/', { headers })
        ]);

        setReportData(reportRes.data);
        setFields(fieldsRes.data);
        setSeasons(seasonsRes.data);
      } catch (err) {
        console.error(err);
        if (err.response?.status === 403) {
          setError('У вас нет прав для просмотра отчета.');
        } else {
          setError('Не удалось загрузить отчет. Проверьте соединение.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [filters]);

  const handleReset = () => {
    setFilters({ field: '', season: '' });
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>⏳ Загрузка отчета...</div>;
  if (error) return <div style={{ color: 'red', textAlign: 'center', padding: '50px' }}>❌ {error}</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Отчет по затратам</h2>
    
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <select 
          value={filters.field} 
          onChange={(e) => setFilters(prev => ({ ...prev, field: e.target.value }))}
          style={{ padding: '8px' }}
        >
          <option value="">Все поля</option>
          {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>

        <select 
          value={filters.season} 
          onChange={(e) => setFilters(prev => ({ ...prev, season: e.target.value }))}
          style={{ padding: '8px' }}
        >
          <option value="">Все сезоны</option>
          {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <button onClick={handleReset} style={{ padding: '8px 16px' }}>Сбросить</button>
      </div>

      {reportData.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#666' }}>📭 Нет данных для отображения</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f4f4f4' }}>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Поле</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Сезон</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Площадь (га)</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Общие затраты (руб.)</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Затраты (руб./га)</th>
            </tr>
          </thead>
          <tbody>
            {reportData.map(row => (
              <tr key={`${row.field_id}-${row.season_id}`}>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{row.field_name}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{row.season_name}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>{row.area_ha}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>{row.total_cost.toLocaleString('ru-RU', { minimumFractionDigits: 2 })}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>{row.cost_per_ha.toLocaleString('ru-RU', { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ReportPage;