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

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Consulta de Existencias</h2>
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
                                <h3 className={styles.grupoTitle}>{grupo}</h3>
                                <div className={styles.tablaContainer}>
                                    <table className={styles.tabla}>
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Sabor</th>
                                                <th className={styles.textRight}>Stock</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {productosPorGrupo[grupo].map(p => (
                                                <tr key={p.id} className={p.stock === 0 ? styles.agotado : ''}>
                                                    <td className={styles.idCol}>#{p.id}</td>
                                                    <td className={styles.nombreCol}>{p.nombre}</td>
                                                    <td className={`${styles.stockCol} ${styles.textRight}`}>
                                                        <span className={styles.stockValue}>
                                                            {p.stock}
                                                        </span>
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
                    <button className={styles.cerrarFooterBtn} onClick={onClose}>Cerrar</button>
                </div>
            </div>
        </div>
    );
};

export default ConsultaStockModal;
