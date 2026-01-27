import React, { useState, useEffect } from 'react';
import { db } from '../lib/db/database';
import styles from './ResumenInventario.module.css';

const ResumenInventario = () => {
    const [metricas, setMetricas] = useState({
        totalCosto: 0,
        totalVenta: 0,
        ganancia: 0,
        gananciaBs: 0,
        productosHuerfanos: 0,
        productosOcultos: 0,
        advertencias: []
    });

    const [tasa, setTasa] = useState(0);
    const [fechaTasa, setFechaTasa] = useState('');

    useEffect(() => {
        const cargarDatosYCalcular = async () => {
            try {
                // 1. Obtener datos base de productos y grupos
                const todosProductos = await db.productos.toArray();
                const grupos = await db.grupos.toArray();

                // OPCIÓN B: Filtrar solo productos visibles (inventario vendible)
                const productosOcultos = todosProductos.filter(p => p.visible === false).length;
                const productos = todosProductos.filter(p => p.visible !== false);

                // Obtener tasa y fecha del histórico
                const ultimaEntrada = await db.historico_tasas.orderBy('fecha_tasa').last();
                const valorTasa = ultimaEntrada ? ultimaEntrada.tasa : await db.getUltimaTasaBCV();
                const fecha = ultimaEntrada ? ultimaEntrada.fecha_tasa : 'Config';

                setTasa(valorTasa);
                setFechaTasa(fecha);

                // 2. Mapeo de grupos para acceso rápido a costos y precios
                const gruposMap = grupos.reduce((acc, g) => {
                    acc[g.nombre] = {
                        costo: parseFloat(g.costo_$) || 0,
                        precio: parseFloat(g.precio) || 0
                    };
                    return acc;
                }, {});

                // 3. Arrays para validaciones
                const advertencias = [];
                let productosHuerfanos = 0;

                // 4. Cálculo de totales basado en el stock actual de cada producto
                const totales = productos.reduce((acc, p) => {
                    const info = gruposMap[p.grupo];
                    if (info) {
                        acc.totalCosto += (p.stock || 0) * info.costo;
                        acc.totalVenta += (p.stock || 0) * info.precio;
                    } else if (p.stock > 0) {
                        // Producto con stock pero sin grupo válido
                        productosHuerfanos++;
                        console.warn(`⚠️ Producto huérfano: ${p.id} - ${p.nombre} (Grupo: ${p.grupo}, Stock: ${p.stock})`);
                        advertencias.push(`${p.nombre} (Stock: ${p.stock}) no tiene grupo válido`);
                    }
                    return acc;
                }, { totalCosto: 0, totalVenta: 0 });

                // 5. Validar grupos con margen negativo
                grupos.forEach(g => {
                    if (g.costo_$ > g.precio) {
                        advertencias.push(`Grupo "${g.nombre}" tiene margen negativo (Costo: $${g.costo_$}, Precio: $${g.precio})`);
                    }
                });

                const gananciaUsd = totales.totalVenta - totales.totalCosto;

                setMetricas({
                    ...totales,
                    ganancia: gananciaUsd,
                    gananciaBs: gananciaUsd * valorTasa,
                    productosHuerfanos,
                    productosOcultos,
                    advertencias
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

            {/* Advertencias de calidad de datos */}
            {metricas.advertencias.length > 0 && (
                <div className={styles.advertencias}>
                    <strong>⚠️ Advertencias de Datos:</strong>
                    <ul>
                        {metricas.advertencias.slice(0, 3).map((adv, idx) => (
                            <li key={idx}>{adv}</li>
                        ))}
                        {metricas.advertencias.length > 3 && (
                            <li>... y {metricas.advertencias.length - 3} más</li>
                        )}
                    </ul>
                </div>
            )}

            {/* Información sobre productos excluidos */}
            {metricas.productosOcultos > 0 && (
                <div className={styles.infoBox}>
                    ℹ️ Se excluyeron {metricas.productosOcultos} producto(s) oculto(s) del análisis (solo inventario vendible)
                </div>
            )}

            <div className={styles.grid}>
                <div className={styles.card}>
                    <label>Inversión (Costo $)</label>
                    <span className={styles.valorCosto}>${metricas.totalCosto.toFixed(2)}</span>
                    {metricas.productosHuerfanos > 0 && (
                        <small className={styles.warning}>
                            ⚠️ {metricas.productosHuerfanos} producto(s) sin grupo
                        </small>
                    )}
                </div>

                <div className={styles.card}>
                    <label>Venta Estimada ($)</label>
                    <span className={styles.valorVenta}>${metricas.totalVenta.toFixed(2)}</span>
                </div>

                <div className={styles.card}>
                    <label>Ganancia Potencial ($)</label>
                    <span className={styles.valorGanancia}>${metricas.ganancia.toFixed(2)}</span>
                </div>

                {/* CORRECCIÓN: Error tipográfico en className */}
                <div className={`${styles.card} ${styles.highlightBs}`}>
                    <label>Ganancia Potencial (Bs)</label>
                    <span className={styles.valorBs}>
                        Bs. {metricas.gananciaBs.toLocaleString('es-VE', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}
                    </span>
                    <span className={styles.tasaInfo}>
                        Tasa: {tasa.toFixed(2)} ({fechaTasa})
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ResumenInventario;