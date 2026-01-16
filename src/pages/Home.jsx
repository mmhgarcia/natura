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
    const navigate = useNavigate();

    // Carga inicial de datos desde IndexedDB y utilidades [1-3]
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
                console.error("Error inicializando Home:", err);
            } finally {
                setCargando(false);
            }
        };
        cargarTodo();
    }, []);

    // Lógica para grabar la venta, rebajar stock y registrar estadísticas
    const handleGrabar = async () => {
        if (listaDeSeleccionados.length === 0) return;

        const confirmar = window.confirm(`¿Desea procesar la venta de ${listaDeSeleccionados.length} helados?`);
        if (!confirmar) return;

        try {
            // Procesamos cada producto seleccionado uno por uno
            for (const item of listaDeSeleccionados) {
                const grupoInfo = grupos.find(g => g.nombre === item.grupo);
                const precioUsd = grupoInfo ? grupoInfo.precio : 0;

                // 1. Añadimos el registro a la tabla 'ventas' para estadísticas
                await db.add('ventas', {
                    productoId: item.id,
                    nombre: item.nombre,
                    grupo: item.grupo,
                    precioUsd: precioUsd,
                    cantidad: 1, // Valor fijo solicitado
                    fecha: new Date().toISOString() // Fecha del día actual
                });

                // 2. Rebajamos el stock del producto en la tabla 'productos' [4]
                await db.updateStock(item.id, -1);
            }

            // 3. Refrescamos la UI con los nuevos datos de la DB
            const productosActualizados = await db.getAll('productos');
            setProductos(productosActualizados);

            // 4. Limpiamos la selección y reseteamos totales
            setListaDeSeleccionados([]);
            alert("✅ Venta grabada y stock actualizado correctamente.");
        } catch (error) {
            console.error("Error al procesar la grabación:", error);
            alert("❌ Hubo un error al guardar los datos.");
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
            <h1 className={styles.title}>Natura Ice</h1>
            
            {/* Grid de productos con precio dinámico según grupo [5] */}
            <div className={styles.grid}>
                {productos.filter(p => p.stock > 0).map(p => {
                    const grupoInfo = grupos.find(g => g.nombre === p.grupo);
                    const precio = grupoInfo ? grupoInfo.precio : 0;
                    
                    return (
                        <div key={p.id} className={styles.card} onClick={() => seleccionarProducto(p)}>
                            <img src={p.imagen} alt={p.nombre} />
                            <p>
                                Id: {p.id} Existencia: {p.stock} Precio $: {precio.toFixed(2)}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Contenedor Fijo Inferior para Selección y Totales [6, 7] */}
            <div className={styles.selectedContainer}>
                <div className={styles.selectedHeader} style={{ display: 'flex', justifyContent: 'space-between' }}>
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
                                    <button onClick={(e) => {
                                        e.stopPropagation();
                                        eliminarItem(index);
                                    }}>
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
                        <button 
                            className={styles.vaciarBtn} 
                            onClick={() => setListaDeSeleccionados([])}
                            style={{ flex: 1 }}
                        >
                            Vaciar
                        </button>
                        <button 
                            className={styles.grabarBtn}
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