import React, { useState, useEffect } from 'react';
import { db } from '../lib/db/database';
import styles from './ResumenInventario.module.css';

const ResumenInventario = () => {
    const [metricas, setMetricas] = useState({
        totalCosto: 0,
        totalVenta: 0,
        ganancia: 0,
        gananciaBs: 0
    });

    const [tasa, setTasa] = useState(0);

    useEffect(() => {
        const cargarDatosYCalcular = async () => {
            try {
                // 1. Obtener datos base de productos y grupos
                const productos = await db.productos.toArray();
                const grupos = await db.grupos.toArray();

                // ACTUALIZACIÓN FASE 2: 
                // Ya no consulta db.config.get('tasa'). Ahora usa el método dinámico
                // que prioriza el historial de 11 días cargado en la Fase 1.
                const valorTasa = await db.getUltimaTasaBCV();
                setTasa(valorTasa);

                // 2. Mapeo de grupos para acceso rápido a costos y precios
                const gruposMap = grupos.reduce((acc, g) => {
                    acc[g.nombre] = {
                        costo: parseFloat(g.costo_$) || 0,
                        precio: parseFloat(g.precio) || 0
                    };
                    return acc;
                }, {});

                // 3. Cálculo de totales basado en el stock actual de cada producto
                const totales = productos.reduce((acc, p) => {
                    const info = gruposMap[p.grupo];
                    if (info) {
                        acc.totalCosto += (p.stock || 0) * info.costo;
                        acc.totalVenta += (p.stock || 0) * info.precio;
                    }
                    return acc;
                }, { totalCosto: 0, totalVenta: 0 });

                const gananciaUsd = totales.totalVenta - totales.totalCosto;

                setMetricas({
                    ...totales,
                    ganancia: gananciaUsd,
                    gananciaBs: gananciaUsd * valorTasa // Cálculo de la rentabilidad en moneda local
                });
            } catch (error) {
                console.error("Error al calcular resumen de inventario:", error);
            }
        };

        cargarDatosYCalcular();
    }, []);

    return (
        <div className={styles.container}>
            <h2 className={styles.titulo}>Análisis de Inventario Actual</h2>
            
            <div className={styles.grid}>
                <div className={styles.card}>
                    <label>Inversión (Costo $)</label>
                    <span className={styles.valorCosto}>${metricas.totalCosto.toFixed(2)}</span>
                </div>

                <div className={styles.card}>
                    <label>Venta Estimada ($)</label>
                    <span className={styles.valorVenta}>${metricas.totalVenta.toFixed(2)}</span>
                </div>

                <div className={styles.card}>
                    <label>Ganancia Potencial ($)</label>
                    <span className={styles.valorGanancia}>${metricas.ganancia.toFixed(2)}</span>
                </div>

                {/* SECCIÓN RESALTADA: Ganancia en Bs basada en historial */}
                <div className={`${styles.card} styles.highlightBs`}>
                    <label>Ganancia Potencial (Bs)</label>
                    <span className={styles.valorBs}>
                        Bs. {metricas.gananciaBs.toLocaleString('es-VE', { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                        })}
                    </span>
                    <span className={styles.tasaInfo}>Tasa aplicada: {tasa} (BCV Histórico)</span>
                </div>
            </div>
        </div>
    );
};

export default ResumenInventario;