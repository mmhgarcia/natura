import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db/database';

const ModalGrupo = ({ grupo, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    precio: 0,
    costo_$: 0
  });

  useEffect(() => {
    if (grupo) {
      setFormData({
        nombre: grupo.nombre || '',
        precio: grupo.precio || 0,
        costo_$: grupo.costo_$ || 0
      });
    }
  }, [grupo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (grupo) {
        await db.put('grupos', { id: grupo.id, ...formData });
      } else {
        await db.add('grupos', formData);
      }
      onSave();
      onClose();
    } catch (err) {
      alert('Error al guardar: ' + err.message);
    }
  };

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.modal}>
        <h2 style={{color: '#000'}}>GESTIÓN DE GRUPO</h2>
        <form onSubmit={handleSubmit}>
          <div style={modalStyles.field}>
            <label style={{color: '#000'}}>Nombre:</label>
            <input 
              type="text" 
              value={formData.nombre} 
              onChange={e => setFormData({...formData, nombre: e.target.value})}
              required 
            />
          </div>
          <div style={modalStyles.field}>
            <label style={{color: '#000'}}>Precio ($):</label>
            <input 
              type="number" 
              step="0.01"
              value={formData.precio} 
              onChange={e => setFormData({...formData, precio: parseFloat(e.target.value)})}
            />
          </div>
          <div style={modalStyles.field}>
            <label style={{color: '#000'}}>Costo ($):</label>
            <input 
              type="number" 
              step="0.01"
              value={formData.costo_$} 
              onChange={e => setFormData({...formData, costo_$: parseFloat(e.target.value)})}
            />
          </div>
          <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
            <button type="submit" style={{backgroundColor: '#28a745', color: '#fff'}}>Guardar</button>
            <button type="button" onClick={onClose} style={{backgroundColor: '#ccc'}}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const modalStyles = {
  overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000 },
  modal: { backgroundColor: '#fff', padding: '20px', borderRadius: '8px', width: '90%', maxWidth: '400px' },
  field: { display: 'flex', flexDirection: 'column', marginBottom: '10px' }
};

export default ModalGrupo;