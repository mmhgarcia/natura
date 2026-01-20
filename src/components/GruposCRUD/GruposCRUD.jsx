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
      <h1 style={styles.title}>Panel de Grupos</h1>

      {error && <div style={styles.errorAlert}>{error}</div>}

      <button onClick={handleNuevoGrupo} style={styles.nuevoButton}>
        + Agregar Nuevo Grupo
      </button>

      <div style={styles.lista}>
        {grupos.length === 0 ? (
          <div style={styles.vacio}>No hay grupos registrados.</div>
        ) : (
          grupos.map(grupo => (
            <div key={grupo.id} style={styles.item}>
              <div style={styles.itemInfo}>
                <div style={styles.itemNombre}>{grupo.nombre}</div>
                {/* Visualización de Precio y nuevo campo Costo [10, 11] */}
                <div style={styles.itemPrecio}>Precio: ${grupo.precio.toFixed(2)}</div>
                <div style={styles.itemCosto}>
                  Costo: ${grupo.costo_$ ? grupo.costo_$.toFixed(2) : "0.00"}
                </div>
                <div style={styles.itemId}>ID: {grupo.id}</div>
              </div>
              <div style={styles.itemActions}>
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
  container: { padding: '20px', maxWidth: '800px', margin: '0 auto' },
  // Estilo corregido: Blanco para contrastar con el fondo oscuro #242424 [2, 13]
  title: { marginBottom: '20px', color: '#ffffff', fontWeight: 'bold', textAlign: 'center' },
  loading: { padding: '40px', textAlign: 'center', color: '#fff' },
  errorAlert: { backgroundColor: '#fee', color: '#c33', padding: '10px', borderRadius: '4px', marginBottom: '20px' },
  nuevoButton: { marginBottom: '20px', padding: '10px 15px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' },
  lista: { border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden', marginBottom: '20px' },
  vacio: { padding: '40px', textAlign: 'center', color: '#666' },
  item: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', borderBottom: '1px solid #eee', backgroundColor: 'white' },
  itemInfo: { flex: 1 },
  itemNombre: { fontWeight: 'bold', fontSize: '18px', marginBottom: '5px', color: '#333' },
  itemPrecio: { color: '#007bff', marginBottom: '3px', fontWeight: '500' },
  // Estilo específico para el campo de costo en rojo [11]
  itemCosto: { color: '#dc3545', marginBottom: '3px', fontWeight: '500' },
  itemId: { fontSize: '12px', color: '#999' },
  itemActions: { display: 'flex', gap: '10px' },
  btnEditar: { padding: '8px 12px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  btnEliminar: { padding: '8px 12px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  resumen: { marginTop: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px', fontSize: '14px', textAlign: 'center', color: '#333' }
};

export default GruposCRUD;