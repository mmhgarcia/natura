import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/db/database';
import { getTasaBCV } from '../lib/db/utils/tasaUtil';
import styles from './RegistroGasto.module.css';

// Componente para el registro de gastos y retiros con interfaz premium refinada
const RegistroGasto = ({ onClose }) => {
  const navigate = useNavigate();
  const getLocalToday = () => new Date().toLocaleDateString('en-CA');

  const [gasto, setGasto] = useState({
    descripcion: '',
    montoUsd: '',
    montoBs: '',
    categoria: 'Operativo',
    fecha: getLocalToday(),
    metodoPago: 'Efectivo',
    tasa: 0
  });

  const [tasaActual, setTasaActual] = useState(0);

  useEffect(() => {
    const cargarTasa = async () => {
      const tasa = await getTasaBCV();
      setTasaActual(tasa || 1); // Evitar división por cero
      setGasto(prev => ({ ...prev, tasa: tasa || 1 }));
    };
    cargarTasa();
  }, []);

  const handleMontoBsChange = (e) => {
    const bsValue = e.target.value;
    const usdCalc = bsValue && tasaActual > 0 ? (parseFloat(bsValue) / tasaActual).toFixed(2) : '';
    setGasto({ ...gasto, montoBs: bsValue, montoUsd: usdCalc });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!gasto.descripcion || !gasto.montoBs) return;

    const montoBsNum = parseFloat(gasto.montoBs);
    const montoUsdNum = parseFloat(gasto.montoUsd);

    await db.gastos.add({
      ...gasto,
      montoBs: montoBsNum,
      montoUsd: montoUsdNum,
      fecha: new Date(gasto.fecha).toISOString()
    });

    alert('✅ Gasto registrado con éxito');
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <span className={styles.title}>💸 REGISTRAR GASTO / RETIRO</span>
          <button className={styles.closeButton} onClick={() => onClose ? onClose() : navigate(-1)}>×</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.content}>
          <div className={styles.inputRow}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Fecha</label>
              <input
                type="date"
                className={styles.inputField}
                value={gasto.fecha}
                onChange={(e) => setGasto({ ...gasto, fecha: e.target.value })}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Tasa BCV</label>
              <div className={styles.tasaHighlight}>
                Bs. {tasaActual.toFixed(2)}
              </div>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Descripción</label>
            <input
              type="text"
              placeholder="Ej: Pago de transporte, Almuerzo, Empaques..."
              className={styles.inputField}
              value={gasto.descripcion}
              onChange={(e) => setGasto({ ...gasto, descripcion: e.target.value })}
              required
            />
          </div>

          <div className={styles.inputRow}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Monto (Bs.)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                className={styles.inputField}
                value={gasto.montoBs}
                onChange={handleMontoBsChange}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Monto ($)</label>
              <div className={styles.montoBsDisplay} style={{ color: '#007bff', backgroundColor: '#e1f5fe', border: '1px solid #b3e5fc' }}>
                ${parseFloat(gasto.montoUsd || 0).toFixed(2)}
              </div>
            </div>
          </div>

          <div className={styles.inputRow}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Categoría</label>
              <select
                className={styles.selectField}
                value={gasto.categoria}
                onChange={(e) => setGasto({ ...gasto, categoria: e.target.value })}
              >
                <option value="Operativo">🏢 Operativo (Insumos/Local)</option>
                <option value="Personal">👤 Personal (Retiro/Comida)</option>
                <option value="Inversión">📈 Inversión (Nuevos equipos)</option>
                <option value="Otros">❓ Otros</option>
              </select>
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Método de Pago</label>
              <select
                className={styles.selectField}
                value={gasto.metodoPago}
                onChange={(e) => setGasto({ ...gasto, metodoPago: e.target.value })}
              >
                <option value="Efectivo">💵 Efectivo</option>
                <option value="Transferencia">🏦 Transferencia</option>
                <option value="Pago Móvil">📱 Pago Móvil</option>
                <option value="Zelle">💳 Zelle / Otros $</option>
              </select>
            </div>
          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.btnCancelar} onClick={() => onClose ? onClose() : navigate(-1)}>Cancelar</button>
            <button type="submit" className={styles.btnGuardar}>Guardar Registro</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegistroGasto;