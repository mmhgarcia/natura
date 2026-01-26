import { useState, useEffect } from 'react';
import { db } from "../lib/db/database"; 
import styles from './TasaBCV.module.css';

export default function TasaBCV() {
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editandoId, setEditandoId] = useState(null);
  
  // Estado para el formulario (Add/Edit)
  const [formData, setFormData] = useState({
    fecha_tasa: new Date().toISOString().split('T'),
    tasa: ''
  });
  
  const [message, setMessage] = useState('');

  // 1. READ: Cargar historial al iniciar
  useEffect(() => {
    cargarHistorico();
  }, []);

  const cargarHistorico = async () => {
    try {
      setLoading(true);
      // Consulta directa a la tabla de historial
      const datos = await db.getAll('historico_tasas');
      // Ordenar por fecha descendente para mostrar lo más nuevo arriba
      setHistorico(datos.sort((a, b) => new Date(b.fecha_tasa) - new Date(a.fecha_tasa)));
    } catch (err) {
      console.error("Error cargando historial:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. CREATE / UPDATE
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.tasa || !formData.fecha_tasa) return;

    const dataToSave = {
      fecha_tasa: formData.fecha_tasa,
      tasa: parseFloat(formData.tasa)
    };

    try {
      if (editandoId) {
        // Operación de actualización (Update)
        await db.put('historico_tasas', { ...dataToSave, id: editandoId });
        setMessage('✅ Registro actualizado');
      } else {
        // Operación de creación (Create)
        await db.add('historico_tasas', dataToSave);
        setMessage('✅ Nueva tasa agregada');
      }
      
      resetForm();
      cargarHistorico();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ Error al guardar');
    }
  };

  // 3. DELETE
  const handleEliminar = async (id) => {
    if (window.confirm("¿Deseas eliminar este registro de forma permanente?")) {
      await db.del('historico_tasas', id);
      cargarHistorico();
    }
  };

  const startEdit = (reg) => {
    setEditandoId(reg.id);
    setFormData({ 
      fecha_tasa: reg.fecha_tasa, 
      tasa: reg.tasa.toString() 
    });
  };

  const resetForm = () => {
    setEditandoId(null);
    setFormData({ 
      fecha_tasa: new Date().toISOString().split('T'), 
      tasa: '' 
    });
  };

  if (loading) return <div className={styles.loading}>Cargando historial...</div>;

  return (
    <div className={styles.container}>
      {/* Encabezado con estilo GestionPedido */}
      <div className={styles.header}>
        <h2 className={styles.title}>📈 GESTIÓN DE TASAS BCV</h2>
      </div>

      <div className={styles.content}>
        {/* Formulario CRUD */}
        <form onSubmit={handleSubmit}>
          <div className={styles.topRow}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Fecha de Tasa</label>
              <input 
                type="date" 
                value={formData.fecha_tasa} 
                onChange={(e) => setFormData({...formData, fecha_tasa: e.target.value})}
                className={styles.inputSmall}
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Valor Tasa (Bs.)</label>
              <input 
                type="number" 
                step="0.01" 
                value={formData.tasa} 
                onChange={(e) => setFormData({...formData, tasa: e.target.value})}
                placeholder="0.00"
                className={styles.inputSmall}
              />
            </div>
          </div>

          <div className={styles.footer}>
            <button type="submit" className={styles.grabarBtn}>
              {editandoId ? "ACTUALIZAR" : "GRABAR"}
            </button>
            {editandoId && (
              <button type="button" onClick={resetForm} className={styles.limpiarBtn}>
                CANCELAR
              </button>
            )}
          </div>
          {message && <div className={styles.infoBar}>{message}</div>}
        </form>

        {/* Listado de Datos con estilo Product List */}
        <div className={styles.productListContainer}>
          <div className={styles.productListHeader}>REGISTROS EN HISTORICO</div>
          <div className={styles.productList}>
            {historico.length === 0 ? (
              <div className={styles.productName} style={{ textAlign: 'center', padding: '20px' }}>
                No hay registros en el historial.
              </div>
            ) : (
              historico.map(reg => (
                <div key={reg.id} className={styles.productItem}>
                  <div className={styles.productName}>
                    <strong>{reg.fecha_tasa}</strong> — Bs. {reg.tasa.toFixed(2)}
                  </div>
                  <div className={styles.quantityControl}>
                    <button 
                      onClick={() => startEdit(reg)} 
                      className={styles.qtyBtn}
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => handleEliminar(reg.id)} 
                      className={styles.qtyBtn}
                      style={{ color: '#f44336' }}
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}