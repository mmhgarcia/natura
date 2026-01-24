/* src/pages/Estadisticas.jsx */
import { useState, useEffect } from 'react';
import { db } from '../lib/db/database';
import { getTasaBCV } from '../lib/db/utils/tasaUtil';
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
} from 'recharts';
import styles from './Estadisticas.module.css';

const Estadisticas = () => {
  const [datosVentas, setDatosVentas] = useState([]);
  const [tasa, setTasa] = useState(0);
  const [rango, setRango] = useState('7d');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarData = async () => {
      setCargando(true);
      try {
        const [ventasRaw, valorTasa] = await Promise.all([
          db.getAll('ventas'),
          getTasaBCV()
        ]);
        const filtradas = filtrarPorRango(ventasRaw, rango);
        setDatosVentas(filtradas);
        setTasa(valorTasa || 0);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setCargando(false);
      }
    };
    cargarData();
  }, [rango]);

  const filtrarPorRango = (ventas, tipo) => {
    const ahora = new Date();
    return ventas.filter(v => {
      const fechaVenta = new Date(v.fecha);
      if (tipo === 'hoy') return fechaVenta.toDateString() === ahora.toDateString();
      if (tipo === '7d') {
        const limite = new Date();
        limite.setDate(ahora.getDate() - 7);
        return fechaVenta >= limite;
      }
      return true;
    });
  };

  // Preparación de datos para la gráfica [3]
  const dataGrafico = Object.entries(
    datosVentas.reduce((acc, v) => {
      acc[v.nombre] = (acc[v.nombre] || 0) + (v.cantidad || 1);
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }))
   .sort((a, b) => b.value - a.value)
   .slice(0, 6);

  const ingresosUsd = datosVentas.reduce((acc, v) => acc + (v.precioUsd || 0), 0);

  if (cargando) return <div className={styles.loading}>Procesando Analítica...</div>;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>📊 ANALÍTICA DE VENTAS</h2>
      
      {/* Contenedor tipo Card Profesional solicitado */}
      <div className={styles.mainCard}>
        
        <div className={styles.filterBar}>
          <label className={styles.filterLabel}>Rango de fecha:</label>
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
            <span className={styles.ingresosValue}>${ingresosUsd.toFixed(2)}</span>
            <span className={styles.ingresosLabel}>TOTAL USD</span>
          </div>
          <div className={styles.ingresosCard}>
            <span className={styles.ingresosValue}>Bs. {(ingresosUsd * tasa).toFixed(2)}</span>
            <span className={styles.ingresosLabel}>TOTAL BS</span>
          </div>
        </div>

        <div className={styles.chartWrapper}>
          <h3 className={styles.chartTitle}>TOP 6: PRODUCTOS ESTRELLA</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={dataGrafico} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  interval={0} 
                  fontSize={10} 
                  stroke="#555"
                  height={70}
                />
                <YAxis hide /> {/* Ocultamos el eje Y para un look más limpio ya que tenemos etiquetas superiores */}
                <Tooltip 
                  contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar 
                  dataKey="value" 
                  fill="#00BFFF" 
                  radius={[4]}
                  barSize={40}
                >
                  {/* Solicitud: Mostrar cantidad en la parte superior de cada barra */}
                  <LabelList 
                    dataKey="value" 
                    position="top" 
                    style={{ fill: '#2c3e50', fontSize: 12, fontWeight: 'bold' }} 
                  />
                  {dataGrafico.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#007bff' : '#00BFFF'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Estadisticas;