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

// Estilos
const styles = {
  container: { 
    padding: '20px', 
    maxWidth: '1000px', 
    margin: '0 auto',
    minHeight: '100vh'
  },
  title: { 
    marginBottom: '20px', 
    color: '#333',
    fontSize: '24px'
  },
  loading: { 
    padding: '40px', 
    textAlign: 'center',
    fontSize: '18px',
    color: '#666'
  },
  errorAlert: { 
    backgroundColor: '#fee', 
    color: '#c33', 
    padding: '12px', 
    borderRadius: '4px',
    marginBottom: '20px',
    border: '1px solid #fcc'
  },
  controles: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: '25px',
    flexWrap: 'wrap',
    gap: '15px'
  },
  filtros: {
    flex: 1
  },
  filtroGrupo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  filtroLabel: {
    fontSize: '14px',
    color: '#555',
    fontWeight: '500'
  },
  select: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    maxWidth: '200px',
    backgroundColor: 'white'
  },
  nuevoButton: {
    padding: '10px 20px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    whiteSpace: 'nowrap'
  },
  lista: { 
    border: '1px solid #ddd',
    borderRadius: '8px',
    overflow: 'hidden',
    marginBottom: '20px'
  },
  vacio: { 
    padding: '40px', 
    textAlign: 'center', 
    color: '#666',
    fontSize: '16px'
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    padding: '15px',
    borderBottom: '1px solid #eee',
    backgroundColor: 'white',
    gap: '15px'
  },
  itemImagen: {
    width: '60px',
    height: '60px',
    flexShrink: 0
  },
  imagen: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '4px',
    border: '1px solid #eee'
  },
  imagenPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    color: '#999',
    border: '1px dashed #ddd'
  },
  itemInfo: {
    flex: 1,
    minWidth: 0 // Para que el texto no desborde
  },
  itemNombre: { 
    fontWeight: 'bold', 
    fontSize: '16px', 
    marginBottom: '8px',
    color: '#333'
  },
  itemDetalles: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '8px',
    fontSize: '13px'
  },
  detalle: {
    display: 'flex',
    gap: '5px'
  },
  detalleLabel: {
    color: '#666',
    fontWeight: '500'
  },
  detalleValor: {
    color: '#333'
  },
  itemActions: { 
    display: 'flex', 
    gap: '10px',
    flexShrink: 0
  },
  btnEditar: {
    padding: '8px 16px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    whiteSpace: 'nowrap'
  },
  btnEliminar: {
    padding: '8px 16px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    whiteSpace: 'nowrap'
  },
  resumen: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#555',
    flexWrap: 'wrap',
    gap: '10px'
  },
  stockTotal: {
    fontWeight: 'bold',
    color: '#1976d2'
  }
};

export default ProductosCRUD;