// src/pages/SaboresMasVendidos.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/db/database';
import styles from './SaboresMasVendidos.module.css';

const SaboresMasVendidos = () => {
  const navigate = useNavigate();
  const [periodo, setPeriodo] = useState(0); // 0 = actual, 1 = 1 mes atrás, 2 = 2 meses atrás
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [ventasRaw, setVentasRaw] = useState([]);
  const [pedidosRaw, setPedidosRaw] = useState([]);

  useEffect(() => {
    const cargarDatos = async () => {
      setCargando(true);
      try {
        const [ventas, pedidos] = await Promise.all([
          db.getAll('ventas'),
          db.getAll('pedidos')
        ]);
        setVentasRaw(ventas);
        setPedidosRaw(pedidos);
      } catch (error) {
        console.error("Error al cargar ventas y pedidos de Dexie:", error);
      } finally {
        setCargando(false);
      }
    };
    cargarDatos();
  }, []);

  // Calcular etiquetas dinámicas de los meses
  const labelsMeses = useMemo(() => {
    const getMonthLabel = (monthsAgo) => {
      const date = new Date();
      date.setDate(1); // Prevenir desbordamiento de fin de mes
      date.setMonth(date.getMonth() - monthsAgo);
      const name = date.toLocaleDateString('es-ES', { month: 'short' });
      const year = date.getFullYear();
      return `${name.charAt(0).toUpperCase() + name.slice(1)} ${year}`;
    };
    return [getMonthLabel(0), getMonthLabel(1), getMonthLabel(2)];
  }, []);

  // Obtener rango de fecha del periodo seleccionado
  const rangoPeriodo = useMemo(() => {
    const now = new Date();
    // Inicio del mes (00:00:00)
    const inicio = new Date(now.getFullYear(), now.getMonth() - periodo, 1, 0, 0, 0, 0);
    // Fin del mes (23:59:59.999 del último día del mes)
    const fin = new Date(now.getFullYear(), now.getMonth() - periodo + 1, 0, 23, 59, 59, 999);
    return { inicio, fin };
  }, [periodo]);

  // Procesar y agrupar sabores vendidos en el periodo seleccionado
  const saboresAgrupados = useMemo(() => {
    if (cargando) return [];

    const { inicio, fin } = rangoPeriodo;
    const acumulado = {};

    // 1. Filtrar y acumular ventas directas
    ventasRaw.forEach(venta => {
      if (!venta.fecha) return;
      const fechaVenta = new Date(venta.fecha);
      if (fechaVenta >= inicio && fechaVenta <= fin) {
        const key = (venta.nombre || '').toUpperCase().trim();
        if (!key) return;
        
        const cantidad = Number(venta.cantidad) || 1;
        if (!acumulado[key]) {
          acumulado[key] = {
            nombre: venta.nombre,
            cantidad: 0,
            grupo: venta.grupo || 'Otros'
          };
        }
        acumulado[key].cantidad += cantidad;
      }
    });

    // 2. Filtrar y acumular pedidos cerrados
    pedidosRaw.forEach(pedido => {
      if (pedido.estatus !== 'Cerrado') return;
      const dateStr = pedido.fecha_pedido || pedido.createdAt || pedido.fecha;
      if (!dateStr) return;

      let fechaPedido;
      if (dateStr.includes('T')) {
        fechaPedido = new Date(dateStr);
      } else {
        const [year, month, day] = dateStr.split('-').map(Number);
        fechaPedido = new Date(year, month - 1, day, 12, 0, 0); // seguro de zona horaria
      }

      if (fechaPedido >= inicio && fechaPedido <= fin) {
        if (Array.isArray(pedido.items)) {
          pedido.items.forEach(item => {
            const key = (item.nombre || '').toUpperCase().trim();
            if (!key) return;

            const cantidad = Number(item.cantidad) || 0;
            if (!acumulado[key]) {
              acumulado[key] = {
                nombre: item.nombre,
                cantidad: 0,
                grupo: item.grupo || 'Otros'
              };
            }
            acumulado[key].cantidad += cantidad;
          });
        }
      }
    });

    // Convertir a array, filtrar elementos con cantidad > 0, y ordenar descendentemente
    return Object.values(acumulado)
      .filter(item => item.cantidad > 0)
      .sort((a, b) => b.cantidad - a.cantidad);
  }, [ventasRaw, pedidosRaw, rangoPeriodo, cargando]);

  // Filtrar sabores según la búsqueda
  const saboresFiltrados = useMemo(() => {
    if (!busqueda.trim()) return saboresAgrupados;
    const cleanSearch = busqueda.toLowerCase().trim();
    return saboresAgrupados.filter(sabor => 
      sabor.nombre.toLowerCase().includes(cleanSearch) || 
      sabor.grupo.toLowerCase().includes(cleanSearch)
    );
  }, [saboresAgrupados, busqueda]);

  // Métricas del periodo
  const metricas = useMemo(() => {
    let totalUnidades = 0;
    let saborEstrella = 'Ninguno';
    let maxQty = 0;

    saboresAgrupados.forEach(s => {
      totalUnidades += s.cantidad;
      if (s.cantidad > maxQty) {
        maxQty = s.cantidad;
        saborEstrella = s.nombre;
      }
    });

    return {
      totalUnidades,
      saborEstrella,
      cantidadEstrella: maxQty,
      saboresDiferentes: saboresAgrupados.length
    };
  }, [saboresAgrupados]);

  // Cantidad del más vendido (para calcular porcentaje de la barra de progreso)
  const maxCantidad = useMemo(() => {
    return saboresAgrupados[0]?.cantidad || 1;
  }, [saboresAgrupados]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => navigate(-1)} className={styles.backBtn}>
          <span>←</span> Atrás
        </button>
        <h1 className={styles.title}>🍦 Ránking de Sabores</h1>
        <div style={{ width: '60px' }} /> {/* Compensación visual */}
      </div>

      <div className={styles.mainCard}>
        {/* Segmented Control / Tabs */}
        <div className={styles.tabsContainer}>
          {labelsMeses.map((label, index) => (
            <button
              key={index}
              onClick={() => setPeriodo(index)}
              className={`${styles.tab} ${periodo === index ? styles.activeTab : ''}`}
            >
              {index === 0 ? 'Mes Actual' : label}
            </button>
          ))}
        </div>

        {/* Buscador */}
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Buscar sabor o grupo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* Indicador de carga */}
        {cargando ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <span>Cargando analítica...</span>
          </div>
        ) : (
          <>
            {/* Panel de Resumen Rápido */}
            <div className={styles.summaryGrid}>
              <div className={styles.summaryCard}>
                <span className={styles.summaryLabel}>Total Unidades</span>
                <span className={styles.summaryValue}>
                  {metricas.totalUnidades} <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>unds.</span>
                </span>
              </div>
              <div className={styles.summaryCard}>
                <span className={styles.summaryLabel}>Sabor Estrella ⭐</span>
                <span className={`${styles.summaryValue} ${styles.summaryHighlight}`} title={metricas.saborEstrella}>
                  {metricas.saborEstrella === 'Ninguno' 
                    ? 'Ninguno' 
                    : (metricas.saborEstrella.length > 14 
                      ? `${metricas.saborEstrella.slice(0, 12)}...` 
                      : metricas.saborEstrella)}
                </span>
              </div>
            </div>

            {/* Listado de Sabores */}
            {saboresFiltrados.length === 0 ? (
              <div className={styles.noData}>
                {saboresAgrupados.length === 0 
                  ? 'No se registraron ventas en este período.' 
                  : 'No hay coincidencias para tu búsqueda.'}
              </div>
            ) : (
              <div className={styles.list}>
                {saboresFiltrados.map((item, index) => {
                  // Calcular la posición real en el ranking completo (no en el filtrado)
                  const posicionReal = saboresAgrupados.findIndex(s => s.nombre === item.nombre) + 1;
                  const pct = (item.cantidad / maxCantidad) * 100;
                  
                  // Asignar clase de barra y medalla según ranking
                  let rankClass = '';
                  let progressClass = '';
                  let medalla = '';

                  if (posicionReal === 1) {
                    rankClass = styles.rank1;
                    progressClass = styles.progress1;
                    medalla = '🥇';
                  } else if (posicionReal === 2) {
                    rankClass = styles.rank2;
                    progressClass = styles.progress2;
                    medalla = '🥈';
                  } else if (posicionReal === 3) {
                    rankClass = styles.rank3;
                    progressClass = styles.progress3;
                    medalla = '🥉';
                  }

                  return (
                    <div key={item.nombre} className={styles.listItem} style={{ animationDelay: `${index * 0.05}s` }}>
                      <div className={styles.itemHeader}>
                        <div className={styles.leftInfo}>
                          <div className={`${styles.rankBadge} ${rankClass}`}>
                            {medalla || posicionReal}
                          </div>
                          <div>
                            <div className={styles.itemName}>{item.nombre}</div>
                            <span className={styles.itemGroup}>{item.grupo}</span>
                          </div>
                        </div>

                        <div className={styles.qtyWrapper}>
                          <span className={styles.qtyValue}>{item.cantidad}</span>
                          <span className={styles.qtyLabel}>unds.</span>
                        </div>
                      </div>

                      <div className={styles.progressContainer}>
                        <div 
                          className={`${styles.progressBar} ${progressClass}`} 
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SaboresMasVendidos;
