// src/pages/Home.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { db } from '../lib/db/database.js';
import { getTasaBCV } from '../lib/db/utils/tasaUtil.js';
import styles from './Home.module.css';
import FreezerLayout from "../components/FreezerLayout/FreezerLayout.jsx";

const getConstructedImagePath = (nombre) => {
    const cleanName = nombre.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/\s+/g, ""); // Remove spaces
    return `/outputs/small/${cleanName}_400.webp`;
};

const ProductImage = ({ product, className }) => {
    const [src, setSrc] = useState(product.imagen || getConstructedImagePath(product.nombre));
    const [error, setError] = useState(false);

    useEffect(() => {
        setSrc(product.imagen || getConstructedImagePath(product.nombre));
        setError(false);
    }, [product]);

    if (error) {
        return <div className={className} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f0f0', borderRadius: '8px', fontSize: '12px', color: '#666' }}>
            📷 {product.nombre}
        </div>;
    }

    return (
        <img 
            src={src} 
            alt={product.nombre} 
            className={className} 
            onError={() => setError(true)} 
        />
    );
};

function Home() {
    const [productos, setProductos] = useState([]);
    const [grupos, setGrupos] = useState([]);
    const [listaDeSeleccionados, setListaDeSeleccionados] = useState([]);
    const [tasa, setTasa] = useState(0);
    const [cargando, setCargando] = useState(true);
    const [filtroGrupo, setFiltroGrupo] = useState('todos');
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
        if (window.confirm(`⚠️ ¿Estás seguro de que deseas vaciar la lista?`)) {
            setListaDeSeleccionados([]);
        }
    };

    const handleGrabar = async () => {
        if (listaDeSeleccionados.length === 0) return;
        if (!window.confirm(`¿Desea procesar la venta de ${listaDeSeleccionados.length} helados?`)) return;

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
            // Recargar stock localmente
            const p = await db.getAll('productos');
            setProductos(enriquecerProductos(p, grupos));
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

    const { usd, bs } = listaDeSeleccionados.reduce((acc, item) => ({
        usd: acc.usd + (item.precio || 0),
        bs: acc.bs + ((item.precio || 0) * tasa)
    }), { usd: 0, bs: 0 });

    if (cargando) return <div className={styles.loading}>Cargando tienda...</div>;

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
                        <option key={g.id} value={g.nombre}>{g.nombre}</option>
                    ))}
                </select>
            </div>

            <div className={styles.grid}>
                {productosFiltrados.map(p => {
                    const precio = p.precio || 0;
                    const esAgotado = p.stock === 0;
                    const badgeColor = esAgotado ? '#ff4d4d' : (p.stock <= 5 ? '#ffa500' : '#28a745');

                    return (
                        <div 
                            key={p.id} 
                            className={`${styles.card} ${esAgotado ? styles.cardDisabled : ''}`}
                            onClick={() => !esAgotado && seleccionarProducto(p)}
                        >
                            <div className={styles.stockBadge} style={{ backgroundColor: badgeColor }}>
                                {p.stock}
                            </div>
                            
                            <ProductImage product={p} className={styles.productImage} />
                            
                            <h3 className={styles.productTitle}>{p.nombre}</h3>
                            
                            {/* Cambio solicitado: Se añade el ID a la izquierda del precio [2] */}
                            <div className={styles.priceText}>
                                ID: {p.id} - $: {precio.toFixed(2)} - Bs.: {(precio * tasa).toFixed(2)} - Stock: {p.stock}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className={styles.selectedContainer}>
                <div className={styles.selectedHeader} onClick={() => setIsFreezerOpen(true)}>
                    <span>🛒 Items: {listaDeSeleccionados.length}</span>
                    <span>💰 Tasa: {tasa.toFixed(2)}</span>
                </div>
                
                <div className={styles.selectedList}>
                    {listaDeSeleccionados.map((item, index) => (
                        <div key={`${item.id}-${index}`} className={styles.selectedItem}>
                            <span>#{item.id} - {item.nombre}</span>
                            <button className={styles.eliminarBtn} onClick={(e) => { e.stopPropagation(); eliminarItem(index); }}>ELIM</button>
                        </div>
                    ))}
                </div>

                <div className={styles.totalRow}>
                    Total: ${usd.toFixed(2)} | Bs. {bs.toFixed(2)}
                </div>

                <div className={styles.actionButtons}>
                    <button className={styles.vaciarBtn} onClick={handleVaciarLista}>Vaciar</button>
                    <button className={styles.grabarBtn} onClick={handleGrabar} disabled={listaDeSeleccionados.length === 0}>Grabar</button>
                    <button className={styles.ubicarBtn} onClick={() => setIsFreezerOpen(true)}>Ubicar</button>
                </div>
            </div>

            {isFreezerOpen && (
                <div className={styles.modalOverlay} onClick={() => setIsFreezerOpen(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>UBICACIÓN EN FREEZER</h3>
                            <button className={styles.closeModalBtn} onClick={() => setIsFreezerOpen(false)}>×</button>
                        </div>
                        <div className={styles.modalBody}>
                            <FreezerLayout productosSeleccionados={listaDeSeleccionados} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Home;