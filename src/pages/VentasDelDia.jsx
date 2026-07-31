// src/pages/VentasDelDia.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/db/database';
import styles from './VentasDelDia.module.css';

const getLocalToday = () => new Date().toLocaleDateString('en-CA');

const formatHora = (fecha) => fecha.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });

const formatMonto = (valor) => valor.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

const VentasDelDia = () => {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    const cargarVentas = async () => {
        try {
            setLoading(true);
            const todasLasVentas = await db.getAll('ventas');
            const hoy = getLocalToday();

            const delDia = todasLasVentas.filter((v) => {
                const fechaLocal = new Date(v.fecha).toLocaleDateString('en-CA');
                return fechaLocal === hoy;
            });

            const grupos = new Map();
            delDia.forEach((v) => {
                const key = v.transaccionId || `TX-${v.id}`;
                if (!grupos.has(key)) grupos.set(key, []);
                grupos.get(key).push(v);
            });

            const lista = [...grupos.entries()].map(([transaccionId, ventas]) => {
                ventas.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
                const totalUsd = ventas.reduce((acc, v) => acc + (v.precioUsd || 0) * (v.cantidad || 1), 0);
                const tasa = ventas[0]?.tasaVenta || 0;
                return {
                    transaccionId,
                    fecha: new Date(ventas[0].fecha),
                    metodoPago: ventas[0]?.metodoPago || '—',
                    ventas,
                    totalUsd,
                    totalBs: totalUsd * tasa
                };
            });

            lista.sort((a, b) => a.fecha - b.fecha);

            setTickets(lista);
        } catch (error) {
            console.error("Error cargando ventas del día:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarVentas();
    }, []);

    const totalDiaUsd = tickets.reduce((acc, t) => acc + t.totalUsd, 0);
    const totalDiaBs = tickets.reduce((acc, t) => acc + t.totalBs, 0);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <button onClick={() => navigate(-1)} className={styles.backArrow}>←</button>
                <span className={styles.title}>Ventas del Día</span>
                <button onClick={cargarVentas} className={styles.refreshBtn} title="Actualizar">🔄</button>
            </header>

            <div className={styles.summaryBar}>
                <div className={styles.summaryCard}>
                    <span className={styles.summaryNumber}>{tickets.length}</span>
                    <span className={styles.summaryLabel}>TICKETS</span>
                </div>
                <div className={styles.summaryCard}>
                    <span className={styles.summaryNumber}>${formatMonto(totalDiaUsd)}</span>
                    <span className={styles.summaryLabel}>TOTAL USD</span>
                </div>
                <div className={styles.summaryCard}>
                    <span className={styles.summaryNumber}>Bs. {formatMonto(totalDiaBs)}</span>
                    <span className={styles.summaryLabel}>TOTAL BS</span>
                </div>
            </div>

            <div className={styles.ticketsList}>
                {loading ? (
                    <p className={styles.loading}>Cargando ventas...</p>
                ) : tickets.length === 0 ? (
                    <p className={styles.empty}>No hay ventas registradas hoy.</p>
                ) : (
                    tickets.map((t) => (
                        <div key={t.transaccionId} className={styles.ticket}>
                            <div className={styles.ticketHeader}>
                                <span className={styles.ticketStore}>NATURA ICE</span>
                                <span className={styles.ticketSub}>TICKET DE VENTA</span>
                            </div>

                            <div className={styles.dashed} />

                            <div className={styles.ticketMeta}>
                                <div className={styles.metaRow}>
                                    <span>Transacción:</span>
                                    <span>{t.transaccionId}</span>
                                </div>
                                <div className={styles.metaRow}>
                                    <span>Fecha:</span>
                                    <span>{t.fecha.toLocaleDateString('es-VE')}</span>
                                </div>
                                <div className={styles.metaRow}>
                                    <span>Hora:</span>
                                    <span>{formatHora(t.fecha)}</span>
                                </div>
                                <div className={styles.metaRow}>
                                    <span>Pago:</span>
                                    <span>{t.metodoPago}</span>
                                </div>
                                <div className={styles.metaRow}>
                                    <span>Tasa BCV:</span>
                                    <span>Bs. {formatMonto(t.tasa)}</span>
                                </div>
                            </div>

                            <div className={styles.dashed} />

                            <div className={styles.itemsHeader}>
                                <span className={styles.itemsQty}>CANT</span>
                                <span className={styles.itemsName}>PRODUCTO</span>
                                <span className={styles.itemsSubtotal}>SUBT.</span>
                            </div>

                            {t.ventas.map((v, i) => (
                                <div key={v.id || i} className={styles.itemRow}>
                                    <span className={styles.itemsQty}>{v.cantidad || 1}</span>
                                    <span className={styles.itemsName}>{v.nombre}</span>
                                    <span className={styles.itemsSubtotal}>
                                        {formatMonto((v.precioUsd || 0) * (v.cantidad || 1))}
                                    </span>
                                </div>
                            ))}

                            <div className={styles.dashed} />

                            <div className={styles.totalRow}>
                                <span>TOTAL USD</span>
                                <span>${formatMonto(t.totalUsd)}</span>
                            </div>
                            <div className={styles.totalRow}>
                                <span>TOTAL BS</span>
                                <span>Bs. {formatMonto(t.totalBs)}</span>
                            </div>

                            <div className={styles.ticketFooter}>
                                ¡Gracias por su compra!
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default VentasDelDia;
