import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/db/database'; // Importa la instancia de IndexedDB [4]

const PedidosComponente = () => {
    const navigate = useNavigate();
    const [listaPedidos, setListaPedidos] = useState([]);
    const [loading, setLoading] = useState(true);

    // Carga de todos los registros de la tabla pedidos al iniciar [3, 4]
    useEffect(() => {
        const cargarRegistros = async () => {
            try {
                setLoading(true);
                // Se obtienen los datos de la tabla pedidos definida en la base de datos [5]
                const datos = await db.getAll('pedidos');
                setListaPedidos(datos);
            } catch (error) {
                console.error("Error al cargar la tabla de pedidos:", error);
            } finally {
                setLoading(false);
            }
        };
        cargarRegistros();
    }, []);

    const styles = {
        container: { 
            display: 'flex', 
            flexDirection: 'column', 
            width: '100%', 
            minHeight: '100vh', 
            backgroundColor: '#fff' 
        },
        // Header personalizado con el color celeste de Natura [2, 6]
        customHeader: { 
            display: 'flex', 
            alignItems: 'center', 
            padding: '10px 15px', 
            backgroundColor: '#00BFFF', 
            color: 'white', 
            position: 'sticky', 
            top: 0, 
            zIndex: 1000 
        },
        backBtn: { 
            background: 'none', 
            border: 'none', 
            color: 'white', 
            fontSize: '1.8rem', 
            cursor: 'pointer', 
            marginRight: '15px' 
        },
        content: { 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'flex-start', // Alineación estricta a la izquierda
            padding: '20px' 
        },
        title: { 
            fontSize: '28px', // Tamaño definido para títulos en la app [1]
            color: '#00BFFF', 
            textAlign: 'left', 
            margin: '10px 0',
            width: '100%'
        },
        // DISEÑO ESTRICTO DEL CÍRCULO PARA EL SIGNO "+"
                                
        addBtnCircle: { 
            width: '60px',          // Ancho fijo
            height: '60px',         // Alto idéntico para asegurar círculo perfecto
            borderRadius: '50%',    // Bordes al 50% para forma circular
            backgroundColor: '#28a745', // Verde de éxito de Natura [7]
            color: 'white', 
            border: 'none', 
            fontSize: '35px', 
            display: 'flex',        // Flexbox para centrado total
            justifyContent: 'center', 
            alignItems: 'center', 
            margin: '10px 0 25px 0', 
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)', 
            cursor: 'pointer',
            lineHeight: 0,
            padding: 0
        },
        tableContainer: { width: '100%', overflowX: 'auto' },
        table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
        th: { 
            backgroundColor: '#f8f9fa', 
            color: '#333', 
            padding: '12px 8px', 
            borderBottom: '2px solid #00BFFF', 
            textAlign: 'left' 
        },
        td: { 
            padding: '12px 8px', 
            borderBottom: '1px solid #eee', 
            color: '#000' // Texto negro para legibilidad [8]
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.customHeader}>
                <button onClick={() => navigate(-1)} style={styles.backBtn}>←</button>
                <h2 style={{ margin: 0, fontSize: '1.6rem' }}>Pedidos</h2>
            </div>

            <main style={styles.content}>
                
                {/* El signo + encerrado en un círculo estricto */}
                <button 
                    style={styles.addBtnCircle} 
                    onClick={() => console.log("Crear nuevo pedido...")}
                >
                    +
                </button>

                <div style={styles.tableContainer}>
                    {loading ? (
                        <p>Cargando registros de IndexedDB...</p>
                    ) : (
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>ID</th>
                                    <th style={styles.th}>Nº Pedido</th>
                                    <th style={styles.th}>Fecha</th>
                                    <th style={styles.th}>Tasa</th>
                                </tr>
                            </thead>
                            <tbody>
                                {listaPedidos.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>
                                            No hay pedidos registrados en dbTasaBCV.
                                        </td>
                                    </tr>
                                ) : (
                                    listaPedidos.map((p) => (
                                        <tr key={p.id}>
                                            <td style={styles.td}>{p.id}</td>
                                            <td style={styles.td}>{p.numero_pedido}</td>
                                            <td style={styles.td}>
                                                {new Date(p.fecha_pedido).toLocaleDateString()}
                                            </td>
                                            <td style={styles.td}>Bs. {p.tasa}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </main>
        </div>
    );
};

export default PedidosComponente;