// frontend/src/components/WorkEntryForm.jsx
import React, { useState, useEffect } from 'react';
import { getPlantings, createWorkEntry, updateWorkEntry } from '../api/journal';
const WorkEntryForm = ({ entry, onSuccess, onCancel }) => {
  const [plantings, setPlantings] = useState([]);
  const [formData, setFormData] = useState({
    planting: '',
    work_date: '',
    title: '',
    cost: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isEdit] = useState(!!entry);
  useEffect(() => {
    const loadData = async () => {
      try {
        const plantingsData = await getPlantings();
        setPlantings(plantingsData);
        if (entry) {
          setFormData({
            planting: entry.planting || entry.planting_id,
            work_date: entry.work_date || '',
            title: entry.title || '',
            cost: entry.cost?.toString() || '',
            notes: entry.notes || ''
          });
        }
      } catch (err) {
        console.error('Failed to load form data:', err);
      }
    };
    loadData();
  }, [entry]);
  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: null }));
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const payload = {
        ...formData,
        planting: Number(formData.planting),
        cost: parseFloat(formData.cost).toFixed(2)
      };
      if (isEdit) {
        await updateWorkEntry(entry.id, payload);
      } else {
        await createWorkEntry(payload);
      }
      onSuccess();
    } catch (err) {
      if (typeof err === 'object' && !Array.isArray(err)) {
        setErrors(err);
      } else {
        alert(err.detail || 'Произошла ошибка при сохранении');
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <div style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      background: 'rgba(0,0,0,0.5)', display: 'flex', 
      alignItems: 'center', justifyContent: 'center', zIndex: 1000 
    }}>
      <div style={{ 
        background: 'white', padding: '30px', borderRadius: '8px', 
        width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' 
      }}>
        <h2>{isEdit ? 'Редактирование записи' : 'Новая запись'}</h2>
        
        <form onSubmit={handleSubmit}>
          {/* Посев */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Посев *</label>
            <select 
              name="planting" 
              value={formData.planting} 
              onChange={handleChange}
              required
              disabled={loading}
              style={{ width: '100%', padding: '8px' }}
            >
              <option value="">Выберите посев...</option>
              {plantings.map(p => (
                <option key={p.id} value={p.id}>
                  {p.field_name} — {p.crop_name} ({p.season_name})
                </option>
              ))}
            </select>
            {errors.planting && <span style={{ color: 'red', fontSize: '12px' }}>{errors.planting[0]}</span>}
          </div>

          {/* Дата */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Дата работы *</label>
            <input 
              type="date" 
              name="work_date" 
              value={formData.work_date} 
              onChange={handleChange}
              required
              disabled={loading}
              style={{ width: '100%', padding: '8px' }}
            />
            {errors.work_date && <span style={{ color: 'red', fontSize: '12px' }}>{errors.work_date[0]}</span>}
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Название работы *</label>
            <input 
              type="text" 
              name="title" 
              value={formData.title} 
              onChange={handleChange}
              required
              disabled={loading}
              style={{ width: '100%', padding: '8px' }}
            />
            {errors.title && <span style={{ color: 'red', fontSize: '12px' }}>{errors.title[0]}</span>}
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Затраты (руб.) *</label>
            <input 
              type="number" 
              step="0.01" 
              min="0"
              name="cost" 
              value={formData.cost} 
              onChange={handleChange}
              required
              disabled={loading}
              style={{ width: '100%', padding: '8px' }}
            />
            {errors.cost && <span style={{ color: 'red', fontSize: '12px' }}>{errors.cost[0]}</span>}
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Примечание</label>
            <textarea 
              name="notes" 
              value={formData.notes} 
              onChange={handleChange}
              disabled={loading}
              rows="3"
              style={{ width: '100%', padding: '8px' }}
            />
            {errors.notes && <span style={{ color: 'red', fontSize: '12px' }}>{errors.notes[0]}</span>}
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button 
              type="button" 
              onClick={onCancel}
              disabled={loading}
              style={{ padding: '10px 20px', border: '1px solid #ccc', background: 'white', borderRadius: '4px', cursor: 'pointer' }}
            >
              Отмена
            </button>
            <button 
              type="submit" 
              disabled={loading}
              style={{ 
                padding: '10px 20px', background: '#007bff', color: 'white', 
                border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer' 
              }}
            >
              {loading ? 'Сохранение...' : (isEdit ? 'Сохранить изменения' : 'Создать')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkEntryForm;