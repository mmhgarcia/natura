// src/components/ResumenInventario.jsx
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
      // 1. Obtener datos base
      const productos = await db.productos.toArray();
      const grupos = await db.grupos.toArray();
      const configTasa = await db.config.get('tasa'); // Ajusta 'tasa' según tu clave
      
      const valorTasa = configTasa ? parseFloat(configTasa.valor) : 0;
      setTasa(valorTasa);

      // 2. Mapeo de grupos
      const gruposMap = grupos.reduce((acc, g) => {
        acc[g.nombre] = { 
          costo: parseFloat(g.costo_$) || 0, 
          precio: parseFloat(g.precio) || 0 
        };
        return acc;
      }, {});

      // 3. Cálculo de totales
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
        gananciaBs: gananciaUsd * valorTasa // Cálculo de la nueva sección
      });
    };

    cargarDatosYCalcular();
  }, []);

  return (
    <div className={styles.container}>
      <h2>Análisis de Inventario Actual</h2>
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
        
        {/* CUARTA SECCIÓN: Ganancia en Bs */}
        <div className={`${styles.card} ${styles.highlightBs}`}>
          <label>Ganancia Potencial (Bs)</label>
          <span className={styles.valorBs}>
            Bs. {metricas.gananciaBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <small className={styles.tasaInfo}>Tasa aplicada: {tasa}</small>
        </div>
      </div>
    </div>
  );
};

export default ResumenInventario;