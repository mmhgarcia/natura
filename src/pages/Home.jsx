import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { db } from '../lib/db/database.js'; 
import { getTasaBCV } from '../lib/db/utils/tasaUtil.js'; 
import styles from './Home.module.css';

function Home() {
    const [productos, setProductos] = useState([]);
    const [grupos, setGrupos] = useState([]);
    const [listaDeSeleccionados, setListaDeSeleccionados] = useState([]);
    const [tasa, setTasa] = useState(0);
    const [cargando, setCargando] = useState(true);
    
    // Filter state for the group selection [1]
    const [filtroGrupo, setFiltroGrupo] = useState('todos');
    
    const navigate = useNavigate();

    // Initial data load from IndexedDB and utilities [2-4]
    useEffect(() => {
        const cargarTodo = async () => {
            try {
                await db.init(); 
                const [p, g, t] = await Promise.all([
                    db.getAll('productos'),
                    db.getAll('grupos'),
                    getTasaBCV()
                ]);
                setProductos(p);
                setGrupos(g);
                setTasa(t || 0);
            } catch (err) {
                console.error("Error initializing Home:", err);
            } finally {
                setCargando(false);
            }
        };
        cargarTodo();
    }, []);

    // Logic to filter products by stock and group [4]
    const productosFiltrados = productos.filter(p => {
        const tieneStock = p.stock > 0;
        const coincideGrupo = filtroGrupo === 'todos' || p.grupo === filtroGrupo;
        return tieneStock && coincideGrupo;
    });

    // Handle recording the sale with confirmation prompt [5, 6]
    const handleGrabar = async () => {
        if (listaDeSeleccionados.length === 0) return;

        // REQUESTED CHANGE: Confirmation prompt before proceeding
        const confirmar = window.confirm(`¿Desea procesar la venta de ${listaDeSeleccionados.length} helados?`);
        if (!confirmar) return; // Abort if user cancels [5]

        try {
            for (const item of listaDeSeleccionados) {
                const grupoInfo = grupos.find(g => g.nombre === item.grupo);
                const precioUsd = grupoInfo ? grupoInfo.precio : 0;

                // Record each item in the sales table [5]
                await db.add('ventas', {
                    productoId: item.id,
                    nombre: item.nombre,
                    grupo: item.grupo,
                    precioUsd: precioUsd,
                    cantidad: 1,
                    fecha: new Date().toISOString()
                });

                // Update inventory by subtracting 1 from stock [6, 7]
                await db.updateStock(item.id, -1);
            }

            // Refresh local state and clear selection [6]
            const productosActualizados = await db.getAll('productos');
            setProductos(productosActualizados);
            setListaDeSeleccionados([]);
            alert("✅ Venta procesada con éxito.");
        } catch (error) {
            console.error("Error saving sale:", error);
            alert("❌ Error al procesar la venta.");
        }
    };

    const seleccionarProducto = (producto) => {
        setListaDeSeleccionados(prev => [...prev, producto]);
    };

    const eliminarItem = (indexParaEliminar) => {
        setListaDeSeleccionados(prev => prev.filter((_, index) => index !== indexParaEliminar));
    };

    const calcularTotales = () => {
        let usd = 0;
        listaDeSeleccionados.forEach(item => {
            const grupoInfo = grupos.find(g => g.nombre === item.grupo);
            usd += grupoInfo ? grupoInfo.precio : 0;
        });
        return { usd, bs: usd * tasa }; 
    };

    const { usd, bs } = calcularTotales();

    if (cargando) return <div className={styles.loading}>Cargando tienda...</div>;

    return (
        <div className={styles.container}>
            
            {/* Group selection combo [8] */}
            <div style={{ marginTop: '15px', marginBottom: '15px', textAlign: 'center' }}>
                <label htmlFor="filtro-home" style={{ fontWeight: 'bold', marginRight: '10px', color: '#333' }}>
                    Filtrar por Grupo:
                </label>
                <select 
                    id="filtro-home"
                    value={filtroGrupo} 
                    onChange={(e) => setFiltroGrupo(e.target.value)}
                    style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ccc' }}
                >
                    <option value="todos">Todos los helados</option>
                    {grupos.map(g => (
                        <option key={g.id} value={g.nombre}>{g.nombre}</option>
                    ))}
                </select>
            </div>
            
            {/* Product Grid [9] */}
            <div className={styles.grid}>
                {productosFiltrados.map(p => {
                    const grupoInfo = grupos.find(g => g.nombre === p.grupo);
                    const precio = grupoInfo ? grupoInfo.precio : 0;
                    
                    return (
                        <div key={p.id} className={styles.card} onClick={() => seleccionarProducto(p)}>
                            {/* Logic: If image exists, show image and name below; otherwise, name placeholder [9, 10] */}
                            {p.imagen && p.imagen.trim() !== "" ? (
                                <>
                                    <img src={p.imagen} alt={p.nombre} className={styles.imagen} />
                                    <div style={{ fontWeight: 'bold', fontSize: '14px', marginTop: '4px', color: '#333' }}>
                                        {p.nombre}
                                    </div>
                                </>
                            ) : (
                                <div style={{ 
                                    fontWeight: 'bold', fontSize: '14px', height: '100px', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    textAlign: 'center', backgroundColor: '#f9f9f9', borderRadius: '8px',
                                    marginBottom: '10px', color: '#333', padding: '5px'
                                }}>
                                    {p.nombre}
                                </div>
                            )}
                            <p style={{ color: 'red', fontWeight: '600', margin: '5px 0 0 0' }}>
                                Id: {p.id} Existencia: {p.stock} Precio $: {precio.toFixed(2)}
                            </p> 
                        </div>
                    );
                })}
            </div>

            {/* Fixed Selection and Totals Panel [10, 11] */}
            <div className={styles.selectedContainer}>
                <div className={styles.selectedHeader}>
                    <span>Items Seleccionados ({listaDeSeleccionados.length}):</span>
                    <span>Tasa: {tasa.toFixed(2)}</span>
                </div>

                <div className={styles.selectedList}>
                    {listaDeSeleccionados.length === 0 ? (
                        <p style={{ color: '#666', fontSize: '0.9rem', textAlign: 'center' }}>
                            No hay helados seleccionados
                        </p>
                    ) : (
                        listaDeSeleccionados.map((item, index) => {
                            const grupoInfo = grupos.find(g => g.nombre === item.grupo);
                            const precioIndividual = grupoInfo ? grupoInfo.precio : 0;
                            return (
                                <div key={index} className={styles.selectedItem}>
                                    <span>#{item.id} - {item.nombre} (${precioIndividual.toFixed(2)})</span>
                                    <button onClick={(e) => { e.stopPropagation(); eliminarItem(index); }}>
                                        ELIM
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>

                <div style={{ marginTop: '8px', borderTop: '1px solid #ccc', paddingTop: '8px' }}>
                    <h3 style={{ margin: '0 0 8px 0', color: '#000' }}>
                        Total: ${usd.toFixed(2)} | Bs. {bs.toFixed(2)}
                    </h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className={styles.vaciarBtn} onClick={() => setListaDeSeleccionados([])}>
                            Vaciar
                        </button>
                        <button 
                            onClick={handleGrabar}
                            style={{ 
                                flex: 2, 
                                backgroundColor: '#28a745', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '8px', 
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                            disabled={listaDeSeleccionados.length === 0}
                        >
                            Grabar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Home;