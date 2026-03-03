import React, { useState, useEffect } from 'react';
import { db } from '../lib/db/database';
import styles from './ConsultaStockModal.module.css';

const ConsultaStockModal = ({ isOpen, onClose }) => {
    const [productosPorGrupo, setProductosPorGrupo] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            cargarStock();
        }
    }, [isOpen]);

    const cargarStock = async () => {
        try {
            setLoading(true);
            const productos = await db.getAll('productos');

            // Agrupar productos por el campo 'grupo'
            const agrupados = productos.reduce((acc, p) => {
                const grupo = p.grupo || 'Sin Grupo';
                if (!acc[grupo]) {
                    acc[grupo] = [];
                }
                acc[grupo].push(p);
                return acc;
            }, {});

            // Ordenar productos dentro de cada grupo por nombre
            Object.keys(agrupados).forEach(grupo => {
                agrupados[grupo].sort((a, b) => a.nombre.localeCompare(b.nombre));
            });

            setProductosPorGrupo(agrupados);
        } catch (error) {
            console.error("Error al cargar stock:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStock = async (productoId, delta) => {
        try {
            await db.updateStock(productoId, delta);
            // Actualizar el estado local inmediatamente
            setProductosPorGrupo(prev => {
                const nuevo = { ...prev };
                Object.keys(nuevo).forEach(grupo => {
                    nuevo[grupo] = nuevo[grupo].map(p => {
                        if (p.id === productoId) {
                            return { ...p, stock: Math.max(0, p.stock + delta) };
                        }
                        return p;
                    });
                });
                return nuevo;
            });
        } catch (error) {
            console.error("Error al actualizar stock:", error);
        }
    };

    const totalExistencias = Object.values(productosPorGrupo).reduce((acc, grupo) => {
        return acc + grupo.reduce((sum, p) => sum + (p.stock || 0), 0);
    }, 0);

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <div className={styles.headerInfo}>
                        <h2 className={styles.title}>Existencias</h2>
                        <span className={styles.totalBadge}>Total: {totalExistencias}</span>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>×</button>
                </div>

                <div className={styles.body}>
                    {loading ? (
                        <div className={styles.loading}>Cargando existencias...</div>
                    ) : Object.keys(productosPorGrupo).length === 0 ? (
                        <div className={styles.empty}>No hay productos registrados.</div>
                    ) : (
                        Object.keys(productosPorGrupo).sort().map(grupo => (
                            <div key={grupo} className={styles.grupoSection}>
                                <div className={styles.grupoHeader}>
                                    <h3 className={styles.grupoTitle}>{grupo}</h3>
                                    <span className={styles.grupoTotal}>
                                        {productosPorGrupo[grupo].reduce((sum, p) => sum + p.stock, 0)} uds
                                    </span>
                                </div>
                                <div className={styles.tablaContainer}>
                                    <table className={styles.tabla}>
                                        <thead>
                                            <tr>
                                                <th>Sabor</th>
                                                <th className={styles.textCenter}>Gestión Stock</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {productosPorGrupo[grupo].map(p => (
                                                <tr key={p.id} className={p.stock === 0 ? styles.agotado : ''}>
                                                    <td className={styles.nombreCol}>
                                                        <div className={styles.prodInfo}>
                                                            <span className={styles.idBadge}>#{p.id}</span>
                                                            {p.nombre}
                                                        </div>
                                                    </td>
                                                    <td className={styles.stockCol}>
                                                        <div className={styles.controlesStock}>
                                                            <button
                                                                className={styles.btnMenos}
                                                                onClick={() => handleUpdateStock(p.id, -1)}
                                                            >
                                                                −
                                                            </button>
                                                            <span className={styles.stockValue}>
                                                                {p.stock}
                                                            </span>
                                                            <button
                                                                className={styles.btnMas}
                                                                onClick={() => handleUpdateStock(p.id, 1)}
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className={styles.footer}>
                    <button className={styles.cerrarFooterBtn} onClick={onClose}>Listo</button>
                </div>
            </div>
        </div>
    );
};

export default ConsultaStockModal;
