// src/components/GruposCRUD/GruposCRUD.jsx (partes actualizadas)
import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db/database';
import ModalGrupo from './ModalGrupo';

const GruposCRUD = () => {
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [grupoEditando, setGrupoEditando] = useState(null);

  // Cargar grupos al montar el componente
  useEffect(() => {
    cargarGrupos();
  }, []);

  const cargarGrupos = async () => {
    try {
      setLoading(true);
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
    setModalOpen(true);
  };

  const handleEliminar = async (grupo) => {
    if (window.confirm(`¿Estás seguro de eliminar el grupo "${grupo.nombre}"?`)) {
      try {
        // Verificar si hay productos usando este grupo
        const productosConGrupo = await db.getAll('productos', { grupo: grupo.nombre });
        
        if (productosConGrupo.length > 0) {
          alert(`No se puede eliminar. Hay ${productosConGrupo.length} producto(s) usando este grupo.`);
          return;
        }
        
        await db.del('grupos', grupo.id);
        cargarGrupos(); // Recargar la lista
      } catch (err) {
        setError('Error al eliminar: ' + err.message);
      }
    }
  };

  const handleNuevoGrupo = () => {
    setGrupoEditando(null);
    setModalOpen(true);
  };

  const handleGuardarExitoso = () => {
    cargarGrupos(); // Recargar lista después de guardar
  };

  if (loading) {
    return <div style={styles.loading}>Cargando grupos...</div>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Administración de Grupos</h1>
      
      {error && (
        <div style={styles.errorAlert}>
          {error}
        </div>
      )}

      {/* Botón para nuevo grupo */}
      <button 
        onClick={handleNuevoGrupo}
        style={styles.nuevoButton}
      >
        + Agregar Nuevo Grupo
      </button>

      {/* Lista de grupos */}
      <div style={styles.lista}>
        {grupos.length === 0 ? (
          <div style={styles.vacio}>
            No hay grupos registrados. ¡Crea el primero!
          </div>
        ) : (
          grupos.map(grupo => (
            <div key={grupo.id} style={styles.item}>
              <div style={styles.itemInfo}>
                <div style={styles.itemNombre}>{grupo.nombre}</div>
                <div style={styles.itemPrecio}>
                  Precio: ${grupo.precio.toFixed(2)}
                </div>
                <div style={styles.itemId}>ID: {grupo.id}</div>
              </div>

              <div style={styles.itemActions}>
                <button
                  onClick={() => handleEditar(grupo)}
                  style={styles.btnEditar}
                >
                  Editar
                </button>
                <button
                  onClick={() => handleEliminar(grupo)}
                  style={styles.btnEliminar}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Resumen */}
      <div style={styles.resumen}>
        Total: {grupos.length} grupo{grupos.length !== 1 ? 's' : ''}
      </div>

      {/* Modal */}
      {modalOpen && (
        <ModalGrupo
          grupo={grupoEditando}
          onClose={() => setModalOpen(false)}
          onSave={handleGuardarExitoso}
        />
      )}
    </div>
  );
};

// Agrega estos estilos al componente principal
const styles = {
  container: { padding: '20px', maxWidth: '800px', margin: '0 auto' },
  title: { marginBottom: '20px', color: '#333' },
  loading: { padding: '40px', textAlign: 'center' },
  errorAlert: { 
    backgroundColor: '#fee', 
    color: '#c33', 
    padding: '10px', 
    borderRadius: '4px',
    marginBottom: '20px'
  },
  nuevoButton: {
    marginBottom: '20px',
    padding: '10px 15px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  lista: { 
    border: '1px solid #ddd',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '20px'
  },
  vacio: { 
    padding: '40px', 
    textAlign: 'center', 
    color: '#666' 
  },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    borderBottom: '1px solid #eee',
    backgroundColor: 'white'
  },
  itemInfo: { flex: 1 },
  itemNombre: { 
    fontWeight: 'bold', 
    fontSize: '16px', 
    marginBottom: '5px',
    color: '#333' 
  },
  itemPrecio: { color: '#666', marginBottom: '3px' },
  itemId: { fontSize: '12px', color: '#999' },
  itemActions: { display: 'flex', gap: '10px' },
  btnEditar: {
    padding: '8px 12px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  btnEliminar: {
    padding: '8px 12px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  resumen: { 
    marginTop: '20px', 
    padding: '10px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
    fontSize: '14px',
    textAlign: 'center'
  },
};

export default GruposCRUD;