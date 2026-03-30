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
        return <div className={className} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f0f0', borderRadius: '50%', fontSize: '10px', color: '#666', textAlign: 'center', padding: '5px' }}>
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

    const [showPaymentModal, setShowPaymentModal] = useState(false);

    const handleGrabarClick = () => {
        if (listaDeSeleccionados.length === 0) return;
        setShowPaymentModal(true);
    };

    const procesarVenta = async (metodoPago) => {
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
                        fecha: new Date().toISOString(),
                        metodoPago: metodoPago
                    });
                    await db.updateStock(item.id, -1);
                }
            });
            setListaDeSeleccionados([]);
            setShowPaymentModal(false);
            alert(`✅ Venta procesada con éxito (${metodoPago}).`);

            // Recargar stock localmente
            const p = await db.getAll('productos');
            setProductos(enriquecerProductos(p, grupos));
        } catch (error) {
            alert("❌ Error al procesar la venta.");
            setShowPaymentModal(false);
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
                                <div>ID: {p.id} • $: {precio.toFixed(2)}</div>
                                <div>Bs.: {(precio * tasa).toFixed(2)} • Stk: {p.stock}</div>
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
                    <button className={styles.grabarBtn} onClick={handleGrabarClick} disabled={listaDeSeleccionados.length === 0}>Grabar</button>
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

            {showPaymentModal && (
                <div className={styles.modalOverlay} onClick={() => setShowPaymentModal(false)} style={{ zIndex: 9999 }}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center', padding: '24px', borderRadius: '16px', maxWidth: '320px' }}>
                        <h2 style={{ margin: '0 0 5px', color: '#1a7a4a', fontSize: '22px' }}>Confirmar Venta</h2>
                        <p style={{ margin: '0 0 20px', color: '#666', fontSize: '14px' }}>{listaDeSeleccionados.length} helado(s)</p>

                        <div style={{ backgroundColor: '#f9fafb', borderRadius: '12px', padding: '15px', marginBottom: '20px' }}>
                            <h1 style={{ margin: '0 0 5px', color: '#111827', fontSize: '28px' }}>${usd.toFixed(2)}</h1>
                            <h2 style={{ margin: '0', color: '#4b5563', fontSize: '18px' }}>Bs. {bs.toFixed(2)}</h2>
                        </div>

                        <p style={{ margin: '0 0 12px', fontSize: '14px', color: '#374151', fontWeight: '600' }}>¿Método de pago?</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <button onClick={() => procesarVenta('Efectivo')} style={{ padding: '12px', fontSize: '15px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>💵 Efectivo</button>
                            <button onClick={() => procesarVenta('Pago Móvil')} style={{ padding: '12px', fontSize: '15px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>📱 Pago Móvil</button>
                            <button onClick={() => procesarVenta('Zelle')} style={{ padding: '12px', fontSize: '15px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>💳 Zelle / USD</button>
                            <button onClick={() => setShowPaymentModal(false)} style={{ padding: '12px', fontSize: '14px', backgroundColor: 'transparent', color: '#6b7280', border: 'none', borderRadius: '10px', cursor: 'pointer', marginTop: '5px', fontWeight: '600' }}>Cancelar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Home;