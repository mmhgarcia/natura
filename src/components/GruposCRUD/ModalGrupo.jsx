import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db/database';

/** Convierte un string con coma o punto a número. Devuelve 0 si no es válido. */
const parseNum = (val) => parseFloat(String(val).replace(',', '.')) || 0;

const ModalGrupo = ({ grupo, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    precio: '',
    costo_$: '',
    margen: ''
  });

  useEffect(() => {
    if (grupo) {
      setFormData({
        nombre: grupo.nombre || '',
        precio: grupo.precio !== undefined ? String(grupo.precio) : '',
        costo_$: grupo.costo_$ !== undefined ? String(grupo.costo_$) : '',
        margen: grupo.margen !== undefined && grupo.margen !== null && grupo.margen !== 0
          ? String(grupo.margen)
          : ''
      });
    }
  }, [grupo]);

  /** Recalcula precio si margen > 0. Devuelve null si no debe recalcular. */
  const calcularPrecio = (costo, margen) => {
    const m = parseNum(margen);
    if (!margen || margen.toString().trim() === '' || m <= 0) return null;
    return (parseNum(costo) * (1 + m / 100)).toFixed(2);
  };

  const handleCostoChange = (e) => {
    const val = e.target.value;
    const nuevoPrecio = calcularPrecio(val, formData.margen);
    setFormData(prev => ({
      ...prev,
      costo_$: val,
      ...(nuevoPrecio !== null ? { precio: nuevoPrecio } : {})
    }));
  };

  const handleMargenChange = (e) => {
    const val = e.target.value;
    const nuevoPrecio = calcularPrecio(formData.costo_$, val);
    setFormData(prev => ({
      ...prev,
      margen: val,
      ...(nuevoPrecio !== null ? { precio: nuevoPrecio } : {})
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSave = {
      nombre: formData.nombre,
      precio: parseNum(formData.precio),
      costo_$: parseNum(formData.costo_$),
      margen: formData.margen.toString().trim() !== '' ? parseNum(formData.margen) : 0
    };
    try {
      if (grupo) {
        await db.put('grupos', { ...grupo, ...dataToSave });
      } else {
        await db.add('grupos', dataToSave);
      }
      onSave();
      onClose();
    } catch (err) {
      alert('Error al guardar: ' + err.message);
    }
  };

  const margenActivo = formData.margen.toString().trim() !== '' && parseNum(formData.margen) > 0;

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.modal}>
        <h2 style={{ color: '#000' }}>GESTIÓN DE GRUPO</h2>
        <form onSubmit={handleSubmit}>

          {/* Nombre */}
          <div style={modalStyles.field}>
            <label style={{ color: '#000' }}>Nombre:</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={e => setFormData({ ...formData, nombre: e.target.value })}
              required
            />
          </div>

          {/* Precio */}
          <div style={modalStyles.field}>
            <label style={{ color: '#000' }}>
              Precio ($):
              {margenActivo && (
                <span style={{ fontSize: '11px', color: '#888', marginLeft: '6px', fontStyle: 'italic' }}>
                  (calculado por margen)
                </span>
              )}
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={formData.precio}
              onChange={e => setFormData({ ...formData, precio: e.target.value })}
              readOnly={margenActivo}
              style={margenActivo ? { backgroundColor: '#f0f0f0', cursor: 'not-allowed' } : {}}
            />
          </div>

          {/* Costo */}
          <div style={modalStyles.field}>
            <label style={{ color: '#000' }}>Costo ($):</label>
            <input
              type="text"
              inputMode="decimal"
              value={formData.costo_$}
              onChange={handleCostoChange}
            />
          </div>

          {/* Margen */}
          <div style={modalStyles.field}>
            <label style={{ color: '#000' }}>Margen (%):</label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={formData.margen}
              onChange={handleMargenChange}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button type="submit" style={{ backgroundColor: '#28a745', color: '#fff' }}>Guardar</button>
            <button type="button" onClick={onClose} style={{ backgroundColor: '#ccc' }}>Cancelar</button>
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