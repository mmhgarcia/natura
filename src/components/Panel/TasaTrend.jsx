import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../lib/db/database';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    ReferenceLine
} from 'recharts';
import styles from './TasaTrend.module.css';

export default function TasaTrend({ onClose }) {
    const [historico, setHistorico] = useState([]);
    const [predictionDays, setPredictionDays] = useState(7);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('metrics'); // 'metrics' or 'chart'

    useEffect(() => {
        async function loadData() {
            try {
                const data = await db.getAll('historico_tasas');
                // Ordenar por fecha ascendente para el cálculo
                const sorted = data.sort((a, b) => new Date(a.fecha_tasa) - new Date(b.fecha_tasa));
                setHistorico(sorted);
            } catch (err) {
                console.error("Error al cargar histórico para tendencia:", err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const analysis = useMemo(() => {
        if (historico.length < 2) return null;

        // Preparar datos para regresión
        // Usamos el índice como X y la tasa como Y
        const n = historico.length;
        let sumX = 0;
        let sumY = 0;
        let sumXY = 0;
        let sumX2 = 0;

        historico.forEach((point, i) => {
            const x = i;
            const y = point.tasa;
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumX2 += x * x;
        });

        const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const b = (sumY - m * sumX) / n;

        // Generar puntos históricos + proyección
        const lastDate = new Date(historico[historico.length - 1].fecha_tasa);
        const lastRate = historico[historico.length - 1].tasa;

        const data = historico.map((p, i) => ({
            name: p.fecha_tasa,
            tasa: p.tasa,
            tipo: 'Real'
        }));

        // Proyección
        const projectedPoints = [];
        for (let i = 1; i <= predictionDays; i++) {
            const nextDate = new Date(lastDate);
            nextDate.setDate(lastDate.getDate() + i);
            const dateStr = nextDate.toISOString().split('T')[0];
            const projectedRate = m * (n - 1 + i) + b;

            projectedPoints.push({
                name: dateStr,
                proyeccion: parseFloat(projectedRate.toFixed(4)),
                tipo: 'Proyectado'
            });
        }

        // Unir el último punto real con la proyección para continuidad visual
        const chartData = [
            ...data.map((d, i) => ({
                ...d,
                proyeccion: i === data.length - 1 ? d.tasa : null
            })),
            ...projectedPoints
        ];

        const finalProjectedRate = m * (n - 1 + predictionDays) + b;
        const variantPercentage = ((finalProjectedRate - lastRate) / lastRate) * 100;

        return {
            chartData,
            m,
            lastRate,
            finalProjectedRate,
            variantPercentage,
            isUp: m > 0
        };
    }, [historico, predictionDays]);

    const handlePrint = () => {
        const originalTitle = document.title;
        const dateStr = new Date().toISOString().split('T')[0];
        document.title = `Informe_Tendencia_BCV_${dateStr}`;
        window.print();
        setTimeout(() => {
            document.title = originalTitle;
        }, 100);
    };

    if (loading) return <div className={styles.loading}>Analizando tendencias...</div>;
    if (historico.length < 2) {
        return (
            <div className={styles.emptyState}>
                <span style={{ fontSize: '3rem' }}>📉</span>
                <p>Se necesitan al menos 2 registros en el histórico para calcular una tendencia.</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.titleInfo}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        {onClose && (
                            <button onClick={onClose} className={styles.closeBtn} title="Cerrar">✕</button>
                        )}
                        <button onClick={handlePrint} className={styles.printBtn} title="Exportar a PDF / Imprimir">
                            🖨️
                        </button>
                        <h2 className={styles.title}>Analítica de Tendencia BCV</h2>
                    </div>
                    <p className={styles.subtitle}>Basado en algoritmo de regresión lineal sobre {historico.length} registros</p>
                </div>

                <div className={styles.controls}>
                    <label className={styles.rangeLabel}>
                        Proyectar a: <strong>{predictionDays} días</strong>
                    </label>
                    <input
                        type="range"
                        min="1"
                        max="30"
                        value={predictionDays}
                        onChange={(e) => setPredictionDays(parseInt(e.target.value))}
                        className={styles.slider}
                    />
                </div>
            </header>

            <div className={styles.tabs}>
                <button
                    className={`${styles.tabBtn} ${activeTab === 'metrics' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('metrics')}
                >
                    📊 Métricas y Proyección
                </button>
                <button
                    className={`${styles.tabBtn} ${activeTab === 'chart' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('chart')}
                >
                    📈 Gráfico de Tendencia
                </button>
            </div>

            {activeTab === 'metrics' && (
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <span className={styles.statLabel}>Tasa Actual</span>
                        <span className={styles.statValue}>Bs. {analysis?.lastRate.toFixed(2)}</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statLabel}>Proyección ({predictionDays}d)</span>
                        <span className={styles.statValue}>Bs. {analysis?.finalProjectedRate.toFixed(2)}</span>
                    </div>
                    <div className={`${styles.statCard} ${analysis?.isUp ? styles.up : styles.down}`}>
                        <span className={styles.statLabel}>Variación Estimada</span>
                        <span className={styles.statValue}>
                            {analysis?.isUp ? '▲' : '▼'} {Math.abs(analysis?.variantPercentage || 0).toFixed(2)}%
                        </span>
                    </div>
                </div>
            )}

            {activeTab === 'chart' && (
                <div className={styles.chartWrapper}>
                    <ResponsiveContainer width="100%" height={350}>
                        <AreaChart data={analysis?.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorTasa" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorProj" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ff7300" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#ff7300" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                                minTickGap={30}
                            />
                            <YAxis
                                hide={true}
                                domain={['dataMin - 5', 'dataMax + 5']}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1e1e2d',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    color: '#fff'
                                }}
                                itemStyle={{ color: '#fff' }}
                                labelStyle={{ color: 'rgba(255,255,255,0.6)', marginBottom: '5px' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="tasa"
                                stroke="#8884d8"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorTasa)"
                                name="Tasa Real"
                                connectNulls
                            />
                            <Area
                                type="monotone"
                                dataKey="proyeccion"
                                stroke="#ff7300"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                fillOpacity={1}
                                fill="url(#colorProj)"
                                name="Proyección"
                                connectNulls
                            />
                            <ReferenceLine x={historico[historico.length - 1]?.fecha_tasa} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}

            <div className={styles.disclaimer}>
                * Nota: Esta proyección es un cálculo matemático lineal. No considera factores económicos externos ni intervenciones del mercado. Úsese solo como referencia.
            </div>
        </div>
    );
}
