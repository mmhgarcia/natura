/* src/pages/Estadisticas.jsx */
import { useState, useEffect } from 'react';
import { db } from '../lib/db/database'; // [3]
import { getTasaBCV } from '../lib/db/utils/tasaUtil'; // [4, 5]
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  LabelList
} from 'recharts'; // [5, 6]
import styles from './Estadisticas.module.css'; // [5, 7]

const Estadisticas = () => {
  const [datosBI, setDatosBI] = useState([]);
  const [tasa, setTasa] = useState(0);
  const [rango, setRango] = useState('7d');
  const [cargando, setCargando] = useState(true);
  const [metricas, setMetricas] = useState({ ventaTotalUsd: 0, utilidadTotalUsd: 0 });

  useEffect(() => {
    const cargarAnaliticaBI = async () => {
      setCargando(true);
      try {
        // 1. Obtenemos pedidos y tasa en paralelo para optimizar en Android [8, 9]
        const [pedidosRaw, valorTasa] = await Promise.all([
          db.getAll('pedidos'),
          getTasaBCV()
        ]);

        // 2. Filtramos solo pedidos 'Cerrados' (Ventas efectivas) [2]
        const pedidosCerrados = pedidosRaw.filter(p => p.estatus === 'Cerrado');
        
        // 3. Filtramos por el rango de tiempo seleccionado [9]
        const filtrados = filtrarPorRango(pedidosCerrados, rango);

        // 4. Procesamiento de datos para BI: Agregación por producto
        const acumulado = {};
        let ventaSum = 0;
        let utilidadSum = 0;

        filtrados.forEach(pedido => {
          ventaSum += (pedido.total_usd || 0);
          
          // Iteramos los items (formato Array BI sugerido en fases anteriores)
          if (Array.isArray(pedido.items)) {
            pedido.items.forEach(item => {
              if (!acumulado[item.nombre]) {
                acumulado[item.nombre] = { name: item.nombre, utilidad: 0, cantidad: 0 };
              }
              acumulado[item.nombre].utilidad += (item.utilidadUsd || 0);
              acumulado[item.nombre].cantidad += (item.cantidad || 0);
              utilidadSum += (item.utilidadUsd || 0);
            });
          }
        });

        // 5. Preparar datos para el gráfico (Top 6 por utilidad) [10]
        const dataGrafico = Object.values(acumulado)
          .sort((a, b) => b.utilidad - a.utilidad)
          .slice(0, 6);

        setDatosBI(dataGrafico);
        setMetricas({ ventaTotalUsd: ventaSum, utilidadTotalUsd: utilidadSum });
        setTasa(valorTasa || 0);

      } catch (err) {
        console.error("Error cargando analítica BI:", err);
      } finally {
        setCargando(false);
      }
    };

    cargarAnaliticaBI();
  }, [rango]);

  const filtrarPorRango = (pedidos, tipo) => {
    const ahora = new Date();
    return pedidos.filter(p => {
      const fechaPedido = new Date(p.fecha_pedido);
      if (tipo === 'hoy') return fechaPedido.toDateString() === ahora.toDateString();
      if (tipo === '7d') {
        const limite = new Date();
        limite.setDate(ahora.getDate() - 7);
        return fechaPedido >= limite;
      }
      if (tipo === 'mes') {
        return fechaPedido.getMonth() === ahora.getMonth() && 
               fechaPedido.getFullYear() === ahora.getFullYear();
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
          <label className={styles.filterLabel}>Periodo de Análisis:</label>
          <select 
            value={rango} 
            onChange={(e) => setRango(e.target.value)}
            className={styles.select}
          >
            <option value="hoy">Ventas de Hoy</option>
            <option value="7d">Últimos 7 Días</option>
            <option value="mes">Mes Actual</option>
          </select>
        </div>

        <div className={styles.ingresosContainer}>
          <div className={styles.ingresosCard}>
            <span className={styles.ingresosLabel}>VENTA TOTAL ($)</span>
            <span className={styles.ingresosValue}>${metricas.ventaTotalUsd.toFixed(2)}</span>
          </div>
          <div className={styles.ingresosCard} style={{ backgroundColor: '#e8f5e9' }}>
            <span className={styles.ingresosLabel} style={{ color: '#2e7d32' }}>UTILIDAD NETA ($)</span>
            <span className={styles.ingresosValue} style={{ color: '#2e7d32' }}>
              ${metricas.utilidadTotalUsd.toFixed(2)}
            </span>
          </div>
        </div>

        <div className={styles.chartWrapper}>
          <h3 className={styles.chartTitle}>TOP 6: RENTABILIDAD POR PRODUCTO</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={datosBI} margin={{ top: 20, right: 30, left: 0, bottom: 70 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  interval={0} 
                  fontSize={10}
                  stroke="#555"
                  height={80}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [`$${value.toFixed(2)}`, 'Utilidad']}
                />
                <Bar dataKey="utilidad" fill="#00BFFF" radius={[11]} barSize={35}>
                  <LabelList 
                    dataKey="utilidad" 
                    position="top" 
                    formatter={(v) => `$${v.toFixed(2)}`}
                    style={{ fill: '#2c3e50', fontSize: 11, fontWeight: 'bold' }} 
                  />
                  {datosBI.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#FFD700' : '#00BFFF'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.ingresosContainer} style={{ marginTop: '20px' }}>
           <div className={styles.ingresosCard} style={{ gridColumn: 'span 2', background: '#fff3e0' }}>
            <span className={styles.ingresosLabel} style={{ color: '#ef6c00' }}>UTILIDAD ESTIMADA EN BOLÍVARES</span>
            <span className={styles.ingresosValue} style={{ color: '#ef6c00' }}>
              Bs. {(metricas.utilidadTotalUsd * tasa).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
            </span>
            <small style={{ fontSize: '0.7rem', color: '#666' }}>Tasa: {tasa.toFixed(2)}</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Estadisticas;