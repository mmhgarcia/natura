import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/db/database';
import { getTasaBCV } from '../lib/db/utils/tasaUtil';
import styles from './RegistroGasto.module.css';

// Componente para el registro de gastos y retiros con interfaz premium refinada
const RegistroGasto = ({ onClose }) => {
  const navigate = useNavigate();
  const getLocalToday = () => new Date().toLocaleDateString('en-CA');

  const [gastos, setGastos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

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

  const fetchGastos = async () => {
    try {
      const allGastos = await db.gastos.orderBy('fecha').reverse().toArray();
      setGastos(allGastos);
    } catch (error) {
      console.error("Error fetching gastos:", error);
    }
  };

  useEffect(() => {
    const cargarDatos = async () => {
      const tasa = await getTasaBCV();
      setTasaActual(tasa || 1); // Evitar división por cero
      setGasto(prev => ({ ...prev, tasa: tasa || 1 }));
      await fetchGastos();
    };
    cargarDatos();
  }, []);

  const resetForm = () => {
    setGasto({
      descripcion: '',
      montoUsd: '',
      montoBs: '',
      categoria: 'Operativo',
      fecha: getLocalToday(),
      metodoPago: 'Efectivo',
      tasa: tasaActual
    });
    setEditingId(null);
    setShowForm(false);
  };

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

    const gastoData = {
      ...gasto,
      montoBs: montoBsNum,
      montoUsd: montoUsdNum,
      fecha: new Date(gasto.fecha).toISOString()
    };

    try {
      if (editingId) {
        await db.gastos.put({ ...gastoData, id: editingId });
        alert('✅ Gasto actualizado con éxito');
      } else {
        await db.gastos.add(gastoData);
        alert('✅ Gasto registrado con éxito');
      }
      await fetchGastos();
      resetForm();
    } catch (error) {
      console.error("Error saving gasto:", error);
      alert('❌ Error al guardar el gasto');
    }
  };

  const handleEdit = (item) => {
    setGasto({
      ...item,
      fecha: item.fecha.split('T')[0], // Ajustar fecha para input type="date"
      montoUsd: item.montoUsd.toString(),
      montoBs: item.montoBs.toString()
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDeleteClick = (id) => {
    setShowDeleteConfirm(id);
  };

  const confirmDelete = async () => {
    if (showDeleteConfirm) {
      await db.gastos.delete(showDeleteConfirm);
      await fetchGastos();
      setShowDeleteConfirm(null);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header Fijo */}
      <div className={styles.mainHeader}>
        <span className={styles.mainTitle}>💸 Registro de Gastos</span>
        <button className={styles.closeMainButton} onClick={() => onClose ? onClose() : navigate(-1)}>×</button>
      </div>

      {/* Lista de Gastos */}
      <div className={styles.listContainer}>
        {gastos.length === 0 ? (
          <div className={styles.emptyState}>No hay gastos registrados.</div>
        ) : (
          gastos.map((item) => (
            <div key={item.id} className={styles.expenseItem}>
              <div className={styles.expenseInfo}>
                <span className={styles.expenseDesc}>{item.descripcion}</span>
                <span className={styles.expenseMeta}>
                  {new Date(item.fecha).toLocaleDateString()} • {item.categoria}
                </span>
              </div>
              <div className={styles.expenseActions}>
                <div className={styles.expenseAmount}>
                  ${item.montoUsd?.toFixed(2)}
                  <span className={styles.amountBs}>Bs. {item.montoBs?.toFixed(2)}</span>
                </div>
                <div className={styles.actionButtons}>
                  <button onClick={() => handleEdit(item)} className={styles.btnIconEdit}>✏️</button>
                  <button onClick={() => handleDeleteClick(item.id)} className={styles.btnIconDelete}>🗑️</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB Button */}
      <button className={styles.fab} onClick={() => { resetForm(); setShowForm(true); }}>
        +
      </button>

      {/* Modal Formulario */}
      {showForm && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <div className={styles.header}>
              <span className={styles.title}>{editingId ? 'EDITAR GASTO' : 'NUEVO GASTO'}</span>
              <button className={styles.closeButton} onClick={resetForm}>×</button>
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
                  placeholder="Ej: Pago de transporte, Almuerzo..."
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
                    <option value="Operativo">🏢 Operativo</option>
                    <option value="Personal">👤 Personal</option>
                    <option value="Inversión">📈 Inversión</option>
                    <option value="Otros">❓ Otros</option>
                  </select>
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Método</label>
                  <select
                    className={styles.selectField}
                    value={gasto.metodoPago}
                    onChange={(e) => setGasto({ ...gasto, metodoPago: e.target.value })}
                  >
                    <option value="Efectivo">💵 Efectivo</option>
                    <option value="Transferencia">🏦 Transf.</option>
                    <option value="Pago Móvil">📱 Pago Móvil</option>
                    <option value="Zelle">💳 Zelle</option>
                  </select>
                </div>
              </div>

              <div className={styles.footer}>
                <button type="button" className={styles.btnCancelar} onClick={resetForm}>Cancelar</button>
                <button type="submit" className={styles.btnGuardar}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmacion Eliminar */}
      {showDeleteConfirm && (
        <div className={styles.overlay} style={{ zIndex: 12000 }}>
          <div className={styles.confirmModal}>
            <h3>¿Eliminar gasto?</h3>
            <p>Esta acción no se puede deshacer.</p>
            <div className={styles.confirmActions}>
              <button className={styles.btnCancelar} onClick={() => setShowDeleteConfirm(null)}>Cancelar</button>
              <button className={styles.btnEliminar} onClick={confirmDelete}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistroGasto;