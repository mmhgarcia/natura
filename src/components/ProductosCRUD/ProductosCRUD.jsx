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

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            setLoading(true);
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
                cargarDatos();
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
        cargarDatos();
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
            <h2 style={styles.title}>Administración de Productos</h2>

            {error && <div style={styles.errorAlert}>{error}</div>}

            <div style={styles.controles}>
                <div style={styles.filtroGrupo}>
                    <label htmlFor="filtro-grupo" style={styles.filtroLabel}>Filtrar por grupo:</label>
                    <select 
                        id="filtro-grupo" 
                        value={filtroGrupo} 
                        onChange={(e) => setFiltroGrupo(e.target.value)}
                        style={styles.select}
                    >
                        <option value="todos">Todos los grupos</option>
                        {grupos.map(grupo => (
                            <option key={grupo.id} value={grupo.nombre}>{grupo.nombre}</option>
                        ))}
                    </select>
                </div>
                <button onClick={handleNuevoProducto} style={styles.nuevoButton}>
                    + Nuevo Producto
                </button>
            </div>

            <div style={styles.lista}>
                {productosFiltrados.length === 0 ? (
                    <div style={styles.vacio}>
                        {filtroGrupo === 'todos' 
                            ? 'No hay productos registrados.' 
                            : `No hay productos en "${filtroGrupo}"`}
                    </div>
                ) : (
                    productosFiltrados.map(producto => (
                        <div key={producto.id} style={styles.item}>
                            <div style={styles.itemMain}>
                                <div style={styles.itemImagen}>
                                    {producto.imagen ? (
                                        <img 
                                            src={producto.imagen} 
                                            alt={producto.nombre} 
                                            style={styles.imagen}
                                            onError={(e) => e.target.style.display = 'none'}
                                        />
                                    ) : (
                                        <div style={styles.imagenPlaceholder}>📷</div>
                                    )}
                                </div>

                                <div style={styles.itemInfo}>
                                    <div style={styles.itemHeader}>
                                        {/* ID del producto a la izquierda del nombre [Requerimiento] */}
                                        <span style={styles.itemIdBadge}>#{producto.id}</span>
                                        <span style={styles.itemNombre}>{producto.nombre}</span>
                                        <span style={{
                                            ...styles.badgeVisible,
                                            ...(producto.visible !== false ? styles.visibleTrue : styles.visibleFalse)
                                        }}>
                                            {producto.visible !== false ? 'Visible' : 'Oculto'}
                                        </span>
                                    </div>
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
                                                color: producto.stock > 0 ? '#2e7d32' : '#c62828'
                                            }}>
                                                {producto.stock} uds
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={styles.itemActions}>
                                <button onClick={() => handleEditar(producto)} style={styles.btnEditar}>
                                    ✏️ Editar
                                </button>
                                <button onClick={() => handleEliminar(producto)} style={styles.btnEliminar}>
                                    🗑️ Eliminar
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div style={styles.resumen}>
                <div>Productos: <strong>{productosFiltrados.length}</strong></div>
                <div style={styles.stockTotal}>Stock total: <strong>{productos.reduce((sum, p) => sum + p.stock, 0)}</strong></div>
            </div>

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
    container: { padding: '20px', maxWidth: '1000px', margin: '0 auto', minHeight: '100vh', fontFamily: 'system-ui' },
    title: { marginBottom: '20px', color: '#1a1a1a', fontSize: '26px', fontWeight: '700' },
    loading: { padding: '40px', textAlign: 'center' },
    errorAlert: { backgroundColor: '#fff5f5', color: '#c53030', padding: '12px', borderRadius: '6px', marginBottom: '20px' },
    controles: { display: 'flex', justifyContent: 'space-between', marginBottom: '25px', padding: '15px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', flexWrap: 'wrap', gap: '15px' },
    filtroGrupo: { display: 'flex', flexDirection: 'column', gap: '8px' },
    filtroLabel: { fontSize: '13px', color: '#666', fontWeight: '600' },
    select: { padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' },
    nuevoButton: { padding: '11px 22px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600' },
    lista: { border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', backgroundColor: 'white' },
    vacio: { padding: '60px', textAlign: 'center', color: '#94a3b8' },
    item: { display: 'flex', flexDirection: 'column', padding: '16px 20px', borderBottom: '1px solid #f1f5f9', backgroundColor: 'white', gap: '12px' },
    itemMain: { display: 'flex', alignItems: 'center', gap: '20px', width: '100%' },
    itemImagen: { width: '64px', height: '64px', flexShrink: 0 },
    imagen: { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' },
    imagenPlaceholder: { width: '100%', height: '100%', backgroundColor: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    itemInfo: { flex: 1, minWidth: 0 },
    itemHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' },
    
    // Estilo para el Badge del ID [1]
    itemIdBadge: {
        backgroundColor: '#f1f5f9',
        color: '#64748b',
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: '700',
        border: '1px solid #e2e8f0'
    },
    
    itemNombre: { fontWeight: '600', fontSize: '16px', color: '#1e293b' },
    badgeVisible: { fontSize: '10px', padding: '2px 8px', borderRadius: '12px', fontWeight: '700' },
    visibleTrue: { backgroundColor: '#dcfce7', color: '#15803d' },
    visibleFalse: { backgroundColor: '#fee2e2', color: '#b91c1c' },
    itemDetalles: { display: 'flex', gap: '20px', fontSize: '13px' },
    detalle: { display: 'flex', gap: '5px' },
    detalleLabel: { color: '#64748b' },
    detalleValor: { color: '#334155', fontWeight: '600' },
    itemActions: { display: 'flex', gap: '10px', width: '100%', justifyContent: 'flex-end', borderTop: '1px solid #f8fafc', paddingTop: '10px' },
    btnEditar: { padding: '8px 16px', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '6px', fontWeight: '600' },
    btnEliminar: { padding: '8px 16px', backgroundColor: '#fff', color: '#ef4444', border: '1px solid #fee2e2', borderRadius: '6px', fontWeight: '600' },
    resumen: { display: 'flex', justifyContent: 'space-between', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '10px', marginTop: '10px' },
    stockTotal: { fontWeight: '700', color: '#2563eb' }
};

export default ProductosCRUD;