import React, { useState } from 'react';
import { db } from '../lib/db/database';
import styles from './RegistroGasto.module.css';

const RegistroGasto = ({ onClose }) => {
  const [gasto, setGasto] = useState({
    descripcion: '',
    montoUsd: '',
    categoria: 'Operativo'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!gasto.descripcion || !gasto.montoUsd) return;

    await db.gastos.add({
      ...gasto,
      montoUsd: parseFloat(gasto.montoUsd),
      fecha: new Date().toISOString()
    });

    alert('Gasto registrado con éxito');
    setGasto({ descripcion: '', montoUsd: '', categoria: 'Operativo' });
    if (onClose) onClose();
  };

  return (
    <div className={styles.formContainer}>
      <h3>💸 Registrar Gasto</h3>
      <form onSubmit={handleSubmit}>
        <div className={styles.inputGroup}>
          <label>Descripción</label>
          <input 
            type="text" 
            placeholder="Ej: Marcador, Almuerzo..."
            value={gasto.descripcion}
            onChange={(e) => setGasto({...gasto, descripcion: e.target.value})}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <label>Monto ($)</label>
          <input 
            type="number" 
            step="0.01"
            placeholder="0.00"
            value={gasto.montoUsd}
            onChange={(e) => setGasto({...gasto, montoUsd: e.target.value})}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <label>Categoría</label>
          <select 
            value={gasto.categoria}
            onChange={(e) => setGasto({...gasto, categoria: e.target.value})}
          >
            <option value="Insumos">Insumos (Empaques/Vasos)</option>
            <option value="Operativo">Operativo (Papelería/Limpieza)</option>
            <option value="Personal">Personal (Comida/Retiro)</option>
            <option value="Otros">Otros</option>
          </select>
        </div>

        <button type="submit" className={styles.btnGuardar}>Guardar Gasto</button>
      </form>
    </div>
  );
};

export default RegistroGasto;