import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db/database'; // Acceso a la instancia dbTasaBCV [4]
import ModalGrupo from './ModalGrupo';

const GruposCRUD = () => {
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [grupoEditando, setGrupoEditando] = useState(null);

  // Carga inicial de los grupos desde IndexedDB [5, 6]
  useEffect(() => {
    cargarGrupos();
  }, []);

  const cargarGrupos = async () => {
    try {
      setLoading(true);
      // Obtiene todos los registros de la tabla 'grupos' [7, 8]
      const datos = await db.getAll('grupos');
      setGrupos(datos);
    } catch (err) {
      setError('Error al cargar los grupos: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditar = (grupo) => {
    setGrupoEditando(grupo);
    setModalOpen(true); // Abre el modal para edición [7, 8]
  };

  const handleEliminar = async (grupo) => {
    if (window.confirm(`¿Estás seguro de eliminar el grupo "${grupo.nombre}"?`)) {
      try {
        // Verifica integridad referencial antes de eliminar [8, 9]
        const productosConGrupo = await db.getAll('productos', { grupo: grupo.nombre });
        if (productosConGrupo.length > 0) {
          alert(`No se puede eliminar. Hay ${productosConGrupo.length} producto(s) usando este grupo.`);
          return;
        }
        await db.del('grupos', grupo.id);
        cargarGrupos(); // Refresca la lista tras eliminar [1, 9]
      } catch (err) {
        setError('Error al eliminar: ' + err.message);
      }
    }
  };

  const handleNuevoGrupo = () => {
    setGrupoEditando(null);
    setModalOpen(true); // Abre el modal para nuevo registro [1, 9]
  };

  if (loading) return <div style={styles.loading}>Cargando grupos...</div>;

  return (
    <div style={styles.container}>
      {/* Título actualizado y color blanco para visibilidad [1, 2] */}
      <h1 style={styles.title}>🏷️ Gestión de Grupos</h1>

      {error && <div style={styles.errorAlert}>{error}</div>}

      <button onClick={handleNuevoGrupo} style={styles.nuevoButton}>
        + Agregar Nuevo Grupo
      </button>

      <div style={styles.lista}>
        {/* Header de columnas */}
        {grupos.length > 0 && (
          <div style={styles.listHeader}>
            <span style={{ flex: 2 }}>Nombre</span>
            <span style={{ flex: 1, textAlign: 'right' }}>Precio</span>
            <span style={{ flex: 1, textAlign: 'right' }}>Costo</span>
            <span style={{ flex: 1, textAlign: 'right' }}>Margen</span>
            <span style={{ width: '130px', textAlign: 'right' }}>Acciones</span>
          </div>
        )}
        {grupos.length === 0 ? (
          <div style={styles.vacio}>No hay grupos registrados.</div>
        ) : (
          grupos.map(grupo => (
            <div key={grupo.id} style={styles.item}>
              <div style={{ ...styles.itemInfo, flex: 2 }}>
                <div style={styles.itemNombre}>{grupo.nombre}</div>
                <div style={styles.itemId}>ID: {grupo.id}</div>
              </div>
              <div style={{ flex: 1, textAlign: 'right' }}>
                <div style={styles.itemPrecio}>${grupo.precio.toFixed(2)}</div>
              </div>
              <div style={{ flex: 1, textAlign: 'right' }}>
                <div style={styles.itemCosto}>${grupo.costo_$ ? grupo.costo_$.toFixed(2) : '0.00'}</div>
              </div>
              <div style={{ flex: 1, textAlign: 'right' }}>
                <div style={styles.itemMargen}>
                  {grupo.margen ? `${grupo.margen}%` : '—'}
                </div>
              </div>
              <div style={{ ...styles.itemActions, width: '130px' }}>
                <button onClick={() => handleEditar(grupo)} style={styles.btnEditar}>Editar</button>
                <button onClick={() => handleEliminar(grupo)} style={styles.btnEliminar}>Eliminar</button>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={styles.resumen}>
        Total: {grupos.length} grupo{grupos.length !== 1 ? 's' : ''}
      </div>

      {/* Renderizado condicional del Modal para evitar duplicidad [10, 12] */}
      {modalOpen && (
        <ModalGrupo
          grupo={grupoEditando}
          onClose={() => setModalOpen(false)}
          onSave={cargarGrupos}
        />
      )}
    </div>
  );
};

const styles = {
  container: { padding: '20px', maxWidth: '900px', margin: '0 auto' },
  title: { marginBottom: '20px', color: '#1a7a4a', fontWeight: '700', textAlign: 'center', fontSize: '24px' },
  loading: { padding: '40px', textAlign: 'center', color: '#fff' },
  errorAlert: { backgroundColor: '#fee', color: '#c33', padding: '10px', borderRadius: '4px', marginBottom: '20px' },
  nuevoButton: { marginBottom: '20px', padding: '10px 15px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' },
  lista: { border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden', marginBottom: '20px' },
  listHeader: { display: 'flex', alignItems: 'center', padding: '10px 15px', backgroundColor: '#f0fdf4', borderBottom: '2px solid #bbf7d0', fontSize: '12px', fontWeight: '700', color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.5px' },
  vacio: { padding: '40px', textAlign: 'center', color: '#666' },
  item: { display: 'flex', alignItems: 'center', padding: '12px 15px', borderBottom: '1px solid #eee', backgroundColor: 'white' },
  itemInfo: { flex: 1 },
  itemNombre: { fontWeight: '600', fontSize: '15px', marginBottom: '2px', color: '#1f2937' },
  itemPrecio: { color: '#2563eb', fontWeight: '600', fontSize: '14px' },
  itemCosto: { color: '#dc2626', fontWeight: '600', fontSize: '14px' },
  itemMargen: { color: '#7c3aed', fontWeight: '600', fontSize: '14px' },
  itemId: { fontSize: '11px', color: '#9ca3af' },
  itemActions: { display: 'flex', gap: '8px' },
  btnEditar: { padding: '6px 12px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
  btnEliminar: { padding: '6px 12px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
  resumen: { marginTop: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px', fontSize: '14px', textAlign: 'center', color: '#333' }
};

export default GruposCRUD;