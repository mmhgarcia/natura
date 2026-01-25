// src/components/ProductosCRUD/ProductosCRUD.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db/database';
import ModalProducto from './ModalProducto';

const ProductosCRUD = () => {
  const [productos, setProductos] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
  const [filtroGrupo, setFiltroGrupo] = useState('todos');

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar productos y grupos en paralelo
      const [productosData, gruposData] = await Promise.all([
        db.getAll('productos'),
        db.getAll('grupos')
      ]);
      
      setProductos(productosData);
      setGrupos(gruposData);
    } catch (err) {
      setError('Error al cargar los datos: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar productos por grupo
  const productosFiltrados = filtroGrupo === 'todos' 
    ? productos 
    : productos.filter(p => p.grupo === filtroGrupo);

  const handleEditar = (producto) => {
    setProductoEditando(producto);
    setModalOpen(true);
  };

  const handleEliminar = async (producto) => {
    if (window.confirm(`¿Estás seguro de eliminar el producto "${producto.nombre}"?`)) {
      try {
        await db.del('productos', producto.id);
        cargarDatos(); // Recargar la lista
      } catch (err) {
        setError('Error al eliminar: ' + err.message);
      }
    }
  };

  const handleNuevoProducto = () => {
    setProductoEditando(null);
    setModalOpen(true);
  };

  const handleGuardarExitoso = () => {
    cargarDatos(); // Recargar lista después de guardar
  };

  const getNombreGrupo = (grupoId) => {
    const grupo = grupos.find(g => g.nombre === grupoId);
    return grupo ? grupo.nombre : grupoId;
  };

  const getPrecioGrupo = (grupoId) => {
    const grupo = grupos.find(g => g.nombre === grupoId);
    return grupo ? grupo.precio : 0;
  };

  if (loading) {
    return <div style={styles.loading}>Cargando productos...</div>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Administración de Productos</h1>
      
      {error && (
        <div style={styles.errorAlert}>
          {error}
        </div>
      )}

      {/* Controles */}
      <div style={styles.controles}>
        <div style={styles.filtros}>
          <div style={styles.filtroGrupo}>
            <label htmlFor="filtro-grupo" style={styles.filtroLabel}>
              Filtrar por grupo:
            </label>
            <select
              id="filtro-grupo"
              value={filtroGrupo}
              onChange={(e) => setFiltroGrupo(e.target.value)}
              style={styles.select}
            >
              <option value="todos">Todos los grupos</option>
              {grupos.map(grupo => (
                <option key={grupo.id} value={grupo.nombre}>
                  {grupo.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button 
          onClick={handleNuevoProducto}
          style={styles.nuevoButton}
        >
          + Nuevo Producto
        </button>
      </div>

      {/* Lista de productos */}
      <div style={styles.lista}>
        {productosFiltrados.length === 0 ? (
          <div style={styles.vacio}>
            {filtroGrupo === 'todos' 
              ? 'No hay productos registrados. ¡Crea el primero!' 
              : `No hay productos en el grupo "${filtroGrupo}"`}
          </div>
        ) : (
          productosFiltrados.map(producto => (
            <div key={producto.id} style={styles.item}>
              <div style={styles.itemImagen}>
                {producto.imagen ? (
                  <img 
                    src={producto.imagen} 
                    alt={producto.nombre}
                    style={styles.imagen}
                    onError={(e) => e.target.style.display = 'none'}
                  />
                ) : (
                  <div style={styles.imagenPlaceholder}>
                    📷
                  </div>
                )}
              </div>

              <div style={styles.itemInfo}>
                <div style={styles.itemNombre}>{producto.nombre}</div>
                
                <div style={styles.itemDetalles}>
                  <div style={styles.detalle}>
                    <span style={styles.detalleLabel}>Grupo:</span>
                    <span style={styles.detalleValor}>
                      {getNombreGrupo(producto.grupo)}
                      {getPrecioGrupo(producto.grupo) > 0 && 
                        ` (+$${getPrecioGrupo(producto.grupo).toFixed(2)})`}
                    </span>
                  </div>
                  
                  <div style={styles.detalle}>
                    <span style={styles.detalleLabel}>Stock:</span>
                    <span style={{
                      ...styles.detalleValor,
                      color: producto.stock > 0 ? '#2e7d32' : '#c62828',
                      fontWeight: 'bold'
                    }}>
                      {producto.stock} unidad{producto.stock !== 1 ? 'es' : ''}
                    </span>
                  </div>
                  
                  <div style={styles.detalle}>
                    <span style={styles.detalleLabel}>ID:</span>
                    <span style={styles.detalleValor}>{producto.id}</span>
                  </div>
                  
                  {producto.createdAt && (
                    <div style={styles.detalle}>
                      <span style={styles.detalleLabel}>Creado:</span>
                      <span style={styles.detalleValor}>
                        {new Date(producto.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div style={styles.itemActions}>
                <button
                  onClick={() => handleEditar(producto)}
                  style={styles.btnEditar}
                >
                  Editar
                </button>
                <button
                  onClick={() => handleEliminar(producto)}
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
        <div>
          Mostrando: <strong>{productosFiltrados.length}</strong> de <strong>{productos.length}</strong> productos
          {filtroGrupo !== 'todos' && ` (filtrado por: ${filtroGrupo})`}
        </div>
        <div style={styles.stockTotal}>
          Stock total: <strong>{productos.reduce((sum, p) => sum + p.stock, 0)}</strong> unidades
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <ModalProducto
          producto={productoEditando}
          grupos={grupos}
          onClose={() => setModalOpen(false)}
          onSave={handleGuardarExitoso}
        />
      )}
    </div>
  );
};

const styles = {
  container: { 
    padding: '20px', 
    maxWidth: '1000px', 
    margin: '0 auto',
    minHeight: '100vh',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  title: { 
    marginBottom: '20px', 
    color: '#1a1a1a',
    fontSize: '26px',
    fontWeight: '700'
  },
  loading: { 
    padding: '40px', 
    textAlign: 'center',
    fontSize: '18px',
    color: '#666'
  },
  errorAlert: { 
    backgroundColor: '#fff5f5', 
    color: '#c53030', 
    padding: '12px 16px', 
    borderRadius: '6px',
    marginBottom: '20px',
    border: '1px solid #feb2b2',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  controles: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: '25px',
    flexWrap: 'wrap',
    gap: '15px',
    backgroundColor: '#fff',
    padding: '15px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  filtros: {
    flex: 1
  },
  filtroGrupo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  filtroLabel: {
    fontSize: '13px',
    color: '#666',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  select: {
    padding: '10px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '14px',
    maxWidth: '240px',
    backgroundColor: '#f8fafc',
    cursor: 'pointer',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  nuevoButton: {
    padding: '11px 22px',
    backgroundColor: '#2563eb', // Azul moderno
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    transition: 'background 0.2s',
    boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
  },
  lista: { 
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    overflow: 'hidden',
    marginBottom: '20px',
    backgroundColor: 'white',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
  },
  vacio: { 
    padding: '60px 20px', 
    textAlign: 'center', 
    color: '#94a3b8',
    fontSize: '16px'
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #f1f5f9',
    backgroundColor: 'white',
    gap: '20px',
    transition: 'background 0.2s'
  },
  itemImagen: {
    width: '64px',
    height: '64px',
    flexShrink: 0,
    position: 'relative' // Para indicadores sobre la imagen
  },
  imagen: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  },
  imagenPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f1f5f9',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    color: '#94a3b8',
    border: '1px dashed #cbd5e1'
  },
  itemInfo: {
    flex: 1,
    minWidth: 0
  },
  itemHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '6px'
  },
  itemNombre: { 
    fontWeight: '600', 
    fontSize: '16px', 
    color: '#1e293b'
  },
  badgeVisible: {
    fontSize: '10px',
    padding: '2px 8px',
    borderRadius: '12px',
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  visibleTrue: { backgroundColor: '#dcfce7', color: '#15803d' },
  visibleFalse: { backgroundColor: '#fee2e2', color: '#b91c1c' },

  itemDetalles: {
    display: 'flex',
    gap: '20px',
    fontSize: '13px'
  },
  detalle: {
    display: 'flex',
    gap: '5px'
  },
  detalleLabel: {
    color: '#64748b',
    fontWeight: '400'
  },
  detalleValor: {
    color: '#334155',
    fontWeight: '600'
  },
  itemActions: { 
    display: 'flex', 
    gap: '8px',
    flexShrink: 0
  },
  btnEditar: {
    padding: '8px 14px',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'all 0.2s'
  },
  btnEliminar: {
    padding: '8px 14px',
    backgroundColor: '#fff',
    color: '#ef4444',
    border: '1px solid #fee2e2',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'all 0.2s'
  },
  resumen: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    backgroundColor: '#f8fafc',
    borderRadius: '10px',
    fontSize: '14px',
    color: '#475569',
    border: '1px solid #e2e8f0'
  },
  stockTotal: {
    fontWeight: '700',
    color: '#2563eb',
    fontSize: '16px'
  },
};

export default ProductosCRUD;