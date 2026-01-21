import { useState, useEffect } from 'react';
import { db } from '../lib/db/database';
import { getTasaBCV } from '../lib/db/utils/tasaUtil';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
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

    const dataGrafico = Object.entries(
        datosVentas.reduce((acc, v) => {
            acc[v.nombre] = (acc[v.nombre] || 0) + (v.cantidad || 1);
            return acc;
        }, {})
    ).map(([name, value]) => ({ name, value }))
     .sort((a, b) => b.value - a.value)
     .slice(0, 6);

    const ingresosUsd = datosVentas.reduce((acc, v) => acc + (v.precioUsd || 0), 0);

    if (cargando) return <div className={styles.loading}>Procesando...</div>;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h2 className={styles.title}>📊 ANALÍTICA DE VENTAS</h2>
                <div className={styles.selectWrapper}>
                    <label className={styles.labelRango}>Rango de fecha:</label>
                    <select value={rango} onChange={(e) => setRango(e.target.value)} className={styles.select}>
                        <option value="hoy">Ventas de Hoy</option>
                        <option value="7d">Últimos 7 Días</option>
                        <option value="mes">Mes Actual</option>
                    </select>
                </div>
            </header>

            <div className={styles.resumen}>
                <div className={styles.statCard}>
                    <span className={styles.statNumber}>${ingresosUsd.toFixed(2)}</span>
                    <span className={styles.statLabel}>TOTAL USD</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statNumber}>Bs. {(ingresosUsd * tasa).toFixed(2)}</span>
                    <span className={styles.statLabel}>TOTAL BS</span>
                </div>
            </div>

            <div className={styles.chartBox}>
                <h3 className={styles.chartTitle}>TOP 6: PRODUCTOS ESTRELLA</h3>
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={dataGrafico} margin={{ top: 10, right: 10, left: -25, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                            dataKey="name" 
                            angle={-45} 
                            textAnchor="end" 
                            interval={0} 
                            fontSize={11} 
                            stroke="#333"
                            height={80}
                        />
                        <YAxis fontSize={12} stroke="#333" />
                        <Tooltip />
                        <Bar dataKey="value" fill="#00BFFF" radius={[2]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default Estadisticas;