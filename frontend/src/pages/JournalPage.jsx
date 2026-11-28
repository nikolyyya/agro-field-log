// frontend/src/pages/JournalPage.jsx 
import React, { useState, useEffect } from 'react';
import { getWorkEntries, getFields, getSeasons, deleteWorkEntry } from '../api/journal';
import WorkEntryForm from '../components/WorkEntryForm';
const JournalPage = ({ role = 'agronom' }) => { 
  const [entries, setEntries] = useState([]);
  const [fields, setFields] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ field: '', season: '' });
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
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
  const handleAddNew = () => {
    setEditingEntry(null);
    setShowForm(true);
  };
  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setShowForm(true);
  };
  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingEntry(null);
    const loadData = async () => {
      try {
        const data = await getWorkEntries(filters);
        setEntries(data.results || data);
      } catch (err) {
        console.error('Failed to refresh list:', err);
      }
    };
    loadData();
  };
  const handleDeleteClick = (id) => {
    setDeleteConfirmId(id);
  };
  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteWorkEntry(deleteConfirmId);
      setEntries(prev => prev.filter(e => e.id !== deleteConfirmId));
    } catch (err) {
      alert(err.detail || 'Ошибка удаления');
    } finally {
      setDeleteConfirmId(null);
    }
  };
  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Загрузка...</div>;
  if (error) return <div style={{ color: 'red', textAlign: 'center', padding: '50px' }}>{error}</div>;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Журнал полевых работ</h2>
        {role === 'agronom' && (
          <button onClick={handleAddNew} style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            + Добавить запись
          </button>
        )}
      </div>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <select value={filters.field} onChange={(e) => setFilters(prev => ({ ...prev, field: e.target.value }))} style={{ padding: '8px' }}>
          <option value="">Все поля</option>
          {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        <select value={filters.season} onChange={(e) => setFilters(prev => ({ ...prev, season: e.target.value }))} style={{ padding: '8px' }}>
          <option value="">Все сезоны</option>
          {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button onClick={() => setFilters({ field: '', season: '' })} style={{ padding: '8px 16px' }}>Сбросить</button>
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
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Прим.</th>
              {role === 'agronom' && <th style={{ padding: '10px', border: '1px solid #ddd' }}>Действия</th>}
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
                {role === 'agronom' && (
                  <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                    <button onClick={() => handleEdit(entry)} style={{ marginRight: '5px', padding: '5px 10px', background: '#ffc107', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✏️</button>
                    <button onClick={() => handleDeleteClick(entry.id)} style={{ padding: '5px 10px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🗑️</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {showForm && (
        <WorkEntryForm 
          entry={editingEntry} 
          onSuccess={handleFormSuccess} 
          onCancel={() => { setShowForm(false); setEditingEntry(null); }} 
        />
      )}
      {deleteConfirmId && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.5)', display: 'flex', 
          alignItems: 'center', justifyContent: 'center', zIndex: 1001 
        }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '8px', textAlign: 'center' }}>
            <h3>Подтвердите удаление</h3>
            <p>Вы действительно хотите удалить эту запись? Это действие нельзя отменить.</p>
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={() => setDeleteConfirmId(null)} style={{ padding: '10px 20px', border: '1px solid #ccc', background: 'white', borderRadius: '4px' }}>Отмена</button>
              <button onClick={confirmDelete} style={{ padding: '10px 20px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}>Удалить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default JournalPage;