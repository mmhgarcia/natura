// src/pages/Estadisticas.jsx
import { useState, useEffect } from 'react';
import { db } from '../lib/db/database'; // [1, 2]
import { getTasaBCV } from '../lib/db/utils/tasaUtil'; // [3, 4]
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell, LabelList, Legend
} from 'recharts'; // [5, 6]
import styles from './Estadisticas.module.css'; // [7]

const Estadisticas = () => {
  const [datosBI, setDatosBI] = useState([]);
  const [datosMargen, setDatosMargen] = useState([]);
  const [tasa, setTasa] = useState(0);
  const [rango, setRango] = useState('7d');
  const [limiteProducto, setLimiteProducto] = useState(5); // Nuevo estado para el filtro
  const [cargando, setCargando] = useState(true);
  const [metricas, setMetricas] = useState({
    ventaTotalUsd: 0,
    utilidadTotalUsd: 0,
    utilidadNetaUsd: 0,
    costoTotalUsd: 0,
    gastosOperativosUsd: 0,
    retirosPersonalesUsd: 0,
    margenPorcentaje: 0
  });

  useEffect(() => {
    const cargarAnaliticaBI = async () => {
      setCargando(true);
      try {
        // 1. Unificación de Fuentes: Pedidos, Ventas y Gastos en paralelo
        const [pedidosRaw, ventasRaw, gastosRaw, valorTasa] = await Promise.all([
          db.getAll('pedidos'),
          db.getAll('ventas'),
          db.getAll('gastos'),
          getTasaBCV()
        ]);

        // 2. Filtrado por rango de tiempo unificado
        const pedidosCerrados = filtrarPorRango(pedidosRaw.filter(p => p.estatus === 'Cerrado'), rango);
        const ventasDirectas = filtrarPorRango(ventasRaw, rango);
        const gastosFiltrados = filtrarPorRango(gastosRaw, rango);

        const acumulado = {};

        // 3. Procesar Pedidos (Ventas a Distribuidores)
        pedidosCerrados.forEach(pedido => {
          if (Array.isArray(pedido.items)) {
            pedido.items.forEach(item => {
              actualizarAcumulado(acumulado, item);
            });
          }
        });

        // 4. Procesar Ventas (Ventas Directas desde Home.jsx)
        ventasDirectas.forEach(venta => {
          actualizarAcumulado(acumulado, {
            nombre: venta.nombre,
            utilidadUsd: venta.utilidadUsd,
            cantidad: 1,
            subtotalUsd: venta.precioUsd,
            costoUnitario: venta.costoUnitarioUsd
          });
        });

        // 5. Procesar Gastos y Retiros
        let gastosOperativosSum = 0;
        let retirosPersonalesSum = 0;

        gastosFiltrados.forEach(g => {
          if (g.categoria === 'Personal') {
            retirosPersonalesSum += g.montoUsd || 0;
          } else {
            gastosOperativosSum += g.montoUsd || 0;
          }
        });

        // 6. Ordenar por Rentabilidad para aplicar el Top
        let productosOrdenados = Object.values(acumulado).sort((a, b) => b.utilidad - a.utilidad);

        // 7. Aplicar Filtro de Universo (Top 5, 10, Todos)
        if (limiteProducto !== 'todos') {
          productosOrdenados = productosOrdenados.slice(0, parseInt(limiteProducto));
        }

        // 8. Calcular Métricas del Universo Definido
        let ventaSum = 0;
        let costoSum = 0;

        productosOrdenados.forEach(prod => {
          ventaSum += prod.ventaTotal;
          costoSum += prod.costoTotal;
        });

        const utilidadBrutaSum = ventaSum - costoSum;
        const utilidadNetaSum = utilidadBrutaSum - gastosOperativosSum;
        const margenPorc = ventaSum > 0 ? (utilidadNetaSum / ventaSum) * 100 : 0;

        setMetricas({
          ventaTotalUsd: ventaSum,
          costoTotalUsd: costoSum,
          utilidadTotalUsd: utilidadBrutaSum,
          utilidadNetaUsd: utilidadNetaSum,
          gastosOperativosUsd: gastosOperativosSum,
          retirosPersonalesUsd: retirosPersonalesSum,
          margenPorcentaje: margenPorc
        });

        // Datos para el gráfico de Ranking
        setDatosBI(productosOrdenados);

        // Datos para el gráfico de Margen de Contribución
        setDatosMargen([
          { name: 'Finanzas USD', Costo: costoSum, Gastos: gastosOperativosSum, Utilidad: utilidadNetaSum }
        ]);

        setTasa(valorTasa || 0);

      } catch (err) {
        console.error("Error en unificación BI:", err);
      } finally {
        setCargando(false);
      }
    };

    cargarAnaliticaBI();
  }, [rango, limiteProducto]); // Añadimos limiteProducto a dependencias

  const actualizarAcumulado = (acc, item) => {
    // Normalización de valores
    const ventaItem = item.subtotalUsd || item.precioUsd || 0;
    const costoItem = (item.costoUnitario || item.costoUnitarioUsd || 0) * (item.cantidad || 1);
    const utilidadItem = item.utilidadUsd || (ventaItem - costoItem);

    if (!acc[item.nombre]) {
      acc[item.nombre] = {
        name: item.nombre,
        utilidad: 0,
        cantidad: 0,
        ventaTotal: 0,
        costoTotal: 0
      };
    }
    acc[item.nombre].utilidad += utilidadItem;
    acc[item.nombre].cantidad += (item.cantidad || 0);
    acc[item.nombre].ventaTotal += ventaItem;
    acc[item.nombre].costoTotal += costoItem;
  };

  const filtrarPorRango = (items, tipo) => {
    const ahora = new Date();
    return items.filter(item => {
      const fechaStr = item.fecha_pedido || item.fecha; // Soporta ambos formatos
      const fechaItem = new Date(fechaStr);
      if (tipo === 'hoy') return fechaItem.toDateString() === ahora.toDateString();
      if (tipo === '7d') {
        const limite = new Date();
        limite.setDate(ahora.getDate() - 7);
        return fechaItem >= limite;
      }
      if (tipo === 'mes') {
        return fechaItem.getMonth() === ahora.getMonth() && fechaItem.getFullYear() === ahora.getFullYear();
      }
      return true;
    });
  };

  if (cargando) return <div className={styles.loading}>Procesando Inteligencia de Negocio...</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>📊 ANALÍTICA FINANCIERA (BI)</h1>

      <div className={styles.mainCard}>
        <div className={styles.filterBar}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label className={styles.filterLabel}>Periodo:</label>
              <select value={rango} onChange={(e) => setRango(e.target.value)} className={styles.select} style={{ width: '100%' }}>
                <option value="hoy">Ventas de Hoy</option>
                <option value="7d">Últimos 7 Días</option>
                <option value="mes">Mes Actual</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label className={styles.filterLabel}>Top Prods:</label>
              <select value={limiteProducto} onChange={(e) => setLimiteProducto(e.target.value)} className={styles.select} style={{ width: '100%' }}>
                <option value={5}>Top 5</option>
                <option value={10}>Top 10</option>
                <option value="todos">Todos</option>
              </select>
            </div>
          </div>
        </div>

        <div className={styles.ingresosContainer}>
          <div className={styles.ingresosCard}>
            <span className={styles.ingresosLabel}>Venta Bruta (Top)</span>
            <span className={styles.ingresosValue}>${metricas.ventaTotalUsd.toFixed(2)}</span>
          </div>
          <div className={styles.ingresosCard} style={{ backgroundColor: '#fff3e0' }}>
            <span className={styles.ingresosLabel}>Margen Real</span>
            <span className={styles.ingresosValue} style={{ color: '#e65100' }}>
              {metricas.margenPorcentaje.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Gráfico de Margen de Contribución */}
        <h3 className={styles.chartTitle}>MARGEN DE CONTRIBUCIÓN (COSTO VS UTILIDAD)</h3>
        <div className={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={datosMargen} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" hide />
              <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
              <Legend />
              <Bar dataKey="Costo" stackId="a" fill="#ef5350" />
              <Bar dataKey="Gastos" stackId="a" fill="#ffa726" />
              <Bar dataKey="Utilidad" stackId="a" fill="#66bb6a" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Rentabilidad por Producto */}
        <h3 className={styles.chartTitle}>
          {limiteProducto === 'todos' ? 'RENTABILIDAD POR PRODUCTO (TODOS)' : `TOP ${limiteProducto}: RENTABILIDAD POR PRODUCTO`}
        </h3>
        <div className={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height={Math.max(250, datosBI.length * 40)}>
            <BarChart data={datosBI} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={100} style={{ fontSize: '0.75rem' }} /> {/* Ajuste para legibilidad vertical */}
              <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
              {/* Cambiamos a layout vertical para mejor visualización cuando son muchos productos */}
              <Bar dataKey="utilidad" fill="#00BFFF">
                <LabelList
                  dataKey="utilidad"
                  position="right"
                  formatter={(v) => `$${v.toFixed(2)}`}
                  style={{ fill: '#2c3e50', fontSize: 10, fontWeight: 'bold' }}
                />
                {datosBI.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#00BFFF' : '#0097a7'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.footerInfo} style={{ marginTop: '20px', textAlign: 'center' }}>
          <p style={{ color: '#2e7d32', fontWeight: 'bold', marginBottom: '5px' }}>
            UTILIDAD NETA REAL: $ {metricas.utilidadNetaUsd.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </p>
          <p style={{ color: '#000', fontWeight: 'bold' }}>
            UTILIDAD NETA REAL: Bs. {(metricas.utilidadNetaUsd * tasa).toLocaleString('es-VE', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </p>
          <small style={{ color: '#666' }}>Tasa: {tasa.toFixed(2)} (Histórico BCV)</small>
        </div>
      </div>

      {/* Tarjeta de Desglose de Utilidad (Segunda Posición) */}
      <div className={styles.mainCard} style={{ marginTop: '20px' }}>
        <h3 className={styles.chartTitle}>💰 DESGLOSE DE UTILIDAD REAL</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '1rem', color: '#444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>(+) Venta Bruta:</span>
            <span style={{ fontWeight: 'bold' }}>${metricas.ventaTotalUsd.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d32f2f' }}>
            <span>(-) Costo de Mercancía:</span>
            <span style={{ fontWeight: 'bold' }}>-${metricas.costoTotalUsd.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f57c00' }}>
            <span>(-) Gastos Operativos:</span>
            <span style={{ fontWeight: 'bold' }}>-${metricas.gastosOperativosUsd.toFixed(2)}</span>
          </div>
          <hr style={{ border: '0', borderTop: '1px solid #eee', margin: '5px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', color: '#2e7d32' }}>
            <span>(=) Utilidad Neta Real:</span>
            <span style={{ fontWeight: 'bold' }}>${metricas.utilidadNetaUsd.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#7b1fa2', marginTop: '10px', fontSize: '0.9rem' }}>
            <span>(⚠) Retiros Personales:</span>
            <span style={{ fontWeight: 'bold' }}>-${metricas.retirosPersonalesUsd.toFixed(2)}</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#666', fontStyle: 'italic' }}>
            * Los retiros personales no afectan la utilidad del negocio, pero sí el efectivo disponible.
          </div>
        </div>
      </div>

      {/* Tarjeta de Guía para No Financieros (Información adicional del historial) */}
      <div className={styles.mainCard} style={{ marginTop: '20px', backgroundColor: '#fdfdfd' }}>
        <h3 className={styles.chartTitle}>📖 GUÍA RÁPIDA DE TUS NÚMEROS</h3>
        <div style={{ fontSize: '0.85rem', color: '#444', lineHeight: '1.4' }}>
          <p><strong>💰 Venta Bruta:</strong> Todo el dinero cobrado por ventas.</p>
          <p><strong>📉 Costo de Mercancía:</strong> Lo que debes apartar para reponer los productos vendidos.</p>
          <p><strong>🏢 Gastos Operativos:</strong> Costos del negocio (empaques, transporte, catálogos).</p>
          <p><strong>✅ Utilidad Neta Real:</strong> Tu ganancia verdadera después de pagar productos y gastos.</p>
          <p><strong>👤 Retiros Personales:</strong> Dinero que has tomado para uso personal (no es un gasto del negocio, pero vacía la caja).</p>
        </div>
      </div>
    </div>
  );
};

export default Estadisticas;