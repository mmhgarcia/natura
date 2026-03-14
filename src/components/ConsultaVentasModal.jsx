import React, { useState, useEffect } from 'react';
import { db } from '../lib/db/database';
import styles from './ConsultaVentasModal.module.css';

const ConsultaVentasModal = ({ isOpen, onClose }) => {
    const [ventasAgrupadas, setVentasAgrupadas] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            cargarVentas();
        }
    }, [isOpen]);

    const cargarVentas = async () => {
        try {
            setLoading(true);
            const todasLasVentas = await db.getAll('ventas');

            // Agrupar ventas por fecha (YYYY-MM-DD)
            const agrupados = todasLasVentas.reduce((acc, venta) => {
                // Asumimos que fecha es ISO string o Date
                const fechaObj = new Date(venta.fecha);
                const fechaKey = fechaObj.toLocaleDateString('es-VE'); // Formato DD/MM/YYYY

                if (!acc[fechaKey]) {
                    acc[fechaKey] = {
                        ventas: [],
                        totalDiaBs: 0,
                        totalCant: 0,
                        fechaRaw: fechaObj // Para ordenar después
                    };
                }

                // Cálculo de total en Bs (Precio Usd * Tasa Venta * Cantidad)
                // Usamos 0 como fallback si falta algún dato
                const precio = venta.precioUsd || 0;
                const tasa = venta.tasaVenta || 0;
                const cantidad = venta.cantidad || 0;
                const totalBs = precio * tasa * cantidad;

                acc[fechaKey].ventas.push({
                    ...venta,
                    totalBs: totalBs
                });

                acc[fechaKey].totalDiaBs += totalBs;
                acc[fechaKey].totalCant += cantidad;

                return acc;
            }, {});

            // Ordenar las fechas de más reciente a más antigua
            const fechasOrdenadas = Object.keys(agrupados).sort((a, b) => {
                return agrupados[b].fechaRaw - agrupados[a].fechaRaw;
            });

            const resultadoFinal = {};
            fechasOrdenadas.forEach(fecha => {
                resultadoFinal[fecha] = agrupados[fecha];
            });

            setVentasAgrupadas(resultadoFinal);
        } catch (error) {
            console.error("Error al cargar ventas:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-VE', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <div className={styles.headerTitleGroup}>
                        <h2 className={styles.title}>Ventas Diarias</h2>
                        <span className={styles.subtitle}>Consulta de Operaciones</span>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>×</button>
                </div>

                <div className={styles.body}>
                    {loading ? (
                        <div className={styles.loading}>Procesando reporte de ventas...</div>
                    ) : Object.keys(ventasAgrupadas).length === 0 ? (
                        <div className={styles.empty}>No se encontraron registros de ventas.</div>
                    ) : (
                        Object.keys(ventasAgrupadas).map(fecha => (
                            <div key={fecha} className={styles.dateSection}>
                                <div className={styles.dateHeader}>
                                    <span>📅 {fecha}</span>
                                </div>
                                <div className={styles.tableContainer}>
                                    <table className={styles.tabla}>
                                        <thead>
                                            <tr>
                                                <th className={styles.idCell}>Id</th>
                                                <th>Nombre</th>
                                                <th className={styles.textCenter}>Cant.</th>
                                                <th className={styles.textRight}>Total Bs</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ventasAgrupadas[fecha].ventas.map((v, index) => (
                                                <tr key={v.id || index}>
                                                    <td className={styles.idCell}>{v.productoId || v.id}</td>
                                                    <td className={styles.nombreCell}>{v.nombre}</td>
                                                    <td className={`${styles.textCenter} ${styles.cantCell}`}>
                                                        {v.cantidad}
                                                    </td>
                                                    <td className={`${styles.textRight} ${styles.totalCell}`}>
                                                        {formatCurrency(v.totalBs)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className={styles.dateFooter}>
                                    <div>
                                        <span className={styles.footerTotalLabel}>Total {fecha}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '30px' }}>
                                        <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                            Cant: {ventasAgrupadas[fecha].totalCant}
                                        </span>
                                        <span>
                                            Bs. {formatCurrency(ventasAgrupadas[fecha].totalDiaBs)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className={styles.footer}>
                    <button className={styles.cerrarBtn} onClick={onClose}>Cerrar Informe</button>
                </div>
            </div>
        </div>
    );
};

export default ConsultaVentasModal;
