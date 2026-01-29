import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { db } from '../lib/db/database.js';
import { getTasaBCV } from '../lib/db/utils/tasaUtil.js';
import styles from './Home.module.css';
import FreezerLayout from "../components/FreezerLayout/FreezerLayout.jsx";

function Home() {
    const [productos, setProductos] = useState([]);
    const [grupos, setGrupos] = useState([]);
    const [listaDeSeleccionados, setListaDeSeleccionados] = useState([]);
    const [tasa, setTasa] = useState(0);
    const [cargando, setCargando] = useState(true);
    const [filtroGrupo, setFiltroGrupo] = useState('todos');
    
    // Estado para controlar la visibilidad del modal del Freezer
    const [isFreezerOpen, setIsFreezerOpen] = useState(false);

    const navigate = useNavigate();

    const enriquecerProductos = (listaProductos, listaGrupos) => {
        const gruposMap = new Map(listaGrupos.map(g => [g.nombre, g]));
        return listaProductos.map(p => {
            const grupoInfo = gruposMap.get(p.grupo);
            return {
                ...p,
                precio: grupoInfo ? grupoInfo.precio : 0,
                costo: grupoInfo ? (grupoInfo.costo_$ || 0) : 0
            };
        });
    };

    useEffect(() => {
        const cargarTodo = async () => {
            try {
                await db.init();
                const [p, g, t] = await Promise.all([
                    db.getAll('productos'),
                    db.getAll('grupos'),
                    getTasaBCV()
                ]);

                setGrupos(g);
                const productosEnriquecidos = enriquecerProductos(p, g);
                setProductos(productosEnriquecidos);
                setTasa(t || 0);
            } catch (err) {
                console.error("Error initializing Home:", err);
            } finally {
                setCargando(false);
            }
        };
        cargarTodo();
    }, []);

    const productosFiltrados = productos.filter(p => {
        const coincideGrupo = filtroGrupo === 'todos' || p.grupo === filtroGrupo;
        const esVisible = p.visible !== false;
        return coincideGrupo && esVisible;
    });

    const handleVaciarLista = () => {
        if (listaDeSeleccionados.length === 0) return;
        const confirmar = window.confirm(`⚠️ ¿Estás seguro de que deseas vaciar la lista?`);
        if (confirmar) setListaDeSeleccionados([]);
    };

    const handleGrabar = async () => {
        if (listaDeSeleccionados.length === 0) return;
        const confirmar = window.confirm(`¿Desea procesar la venta de ${listaDeSeleccionados.length} helados?`);
        if (!confirmar) return;

        try {
            const transaccionId = `TX-${Date.now()}`;
            await db.transaction('rw', [db.ventas, db.productos], async () => {
                for (const item of listaDeSeleccionados) {
                    await db.add('ventas', {
                        productoId: item.id,
                        nombre: item.nombre,
                        grupo: item.grupo,
                        precioUsd: item.precio || 0,
                        costoUnitarioUsd: item.costo || 0,
                        utilidadUsd: (item.precio || 0) - (item.costo || 0),
                        tasaVenta: tasa,
                        transaccionId: transaccionId,
                        cantidad: 1,
                        fecha: new Date().toISOString()
                    });
                    await db.updateStock(item.id, -1);
                }
            });
            setListaDeSeleccionados([]);
            alert("✅ Venta procesada con éxito.");
        } catch (error) {
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
        let usd = listaDeSeleccionados.reduce((acc, item) => acc + (item.precio || 0), 0);
        return { usd, bs: usd * tasa };
    };

    const { usd, bs } = calcularTotales();

    if (cargando) return <div>Cargando tienda...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.filterBar}>
                <label htmlFor="filtro-home">Filtrar por Grupo:</label>
                <select
                    id="filtro-home"
                    value={filtroGrupo}
                    onChange={(e) => setFiltroGrupo(e.target.value)}
                    className={styles.select}
                >
                    <option value="todos">Todos los helados</option>
                    {grupos.map(g => (
                        <option key={g.id} value={g.nombre}>{g.nombre.toUpperCase()}</option>
                    ))}
                </select>
            </div>

            <div className={styles.grid}>
                {productosFiltrados.map(p => {
                    const precio = p.precio || 0;
                    const esAgotado = p.stock === 0;
                    return (
                        <div
                            key={p.id}
                            className={`${styles.card} ${esAgotado ? styles.cardDisabled : ''}`}
                            onClick={() => !esAgotado && seleccionarProducto(p)}
                        >
                            <div className={styles.stockBadge}>{p.stock}</div>
                            {p.imagen ? (
                                <img src={p.imagen} alt={p.nombre} className={styles.productImage} />
                            ) : (
                                <div className={styles.productImage}>📷 {p.nombre}</div>
                            )}
                            <h3 className={styles.productTitle}>{p.nombre}</h3>
                            <p className={styles.priceText}>
                                $: {precio.toFixed(2)} - Bs.: {(precio * tasa).toFixed(2)}
                            </p>
                        </div>
                    );
                })}
            </div>

            <div className={styles.selectedContainer}>
                <div 
                    className={styles.selectedHeader} 
                    onClick={() => setIsFreezerOpen(true)}
                    style={{ cursor: 'pointer' }}
                >
                    Items: <span>{listaDeSeleccionados.length}</span>
                    Tasa: <span>{tasa.toFixed(2)}</span>
                </div>

                <div className={styles.selectedList}>
                    {listaDeSeleccionados.map((item, index) => (
                        <div key={index} className={styles.selectedItem}>
                            <span>#{item.id} - {item.nombre}</span>
                            <button onClick={() => eliminarItem(index)}>ELIM</button>
                        </div>
                    ))}
                </div>

                <div className={styles.totalRow}>
                    Total: ${usd.toFixed(2)} | Bs. {bs.toFixed(2)}
                </div>

                <div className={styles.actionButtons}>
                    <button className={styles.vaciarBtn} onClick={handleVaciarLista}>Vaciar</button>
                    <button className={styles.grabarBtn} onClick={handleGrabar} disabled={listaDeSeleccionados.length === 0}>
                        Grabar
                    </button>
                    
                    <button 
                        className={styles.ubicarBtn} 
                        onClick={() => setIsFreezerOpen(true)}
                    >
                        Ubicar
                    </button>
                </div>
            </div>

            {isFreezerOpen && (
                <div className={styles.modalOverlay} onClick={() => setIsFreezerOpen(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>UBICACIÓN EN FREEZER</h3>
                            <button 
                                className={styles.closeModalBtn} 
                                onClick={() => setIsFreezerOpen(false)}
                            >
                                ×
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <FreezerLayout />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Home;