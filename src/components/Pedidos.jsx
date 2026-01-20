import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/db/database'; // Acceso a dbTasaBCV [1, 4]
import GestionPedido from './GestionPedido';

const PedidosComponente = () => {
    const navigate = useNavigate();
    const [listaPedidos, setListaPedidos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);

    // Carga los registros desde IndexedDB [2]
    const cargarRegistros = async () => {
        try {
            setLoading(true);
            const datos = await db.getAll('pedidos');
            setListaPedidos(datos);
        } catch (error) {
            console.error("Error al cargar pedidos:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarRegistros();
    }, []);

    // Abre el modal para un nuevo pedido [3]
    const handleNuevoPedido = () => {
        setPedidoSeleccionado(null);
        setModalOpen(true);
    };

    // Selecciona un pedido existente y lo pasa al modal de gestión [3]
    const handleSeleccionarPedido = (pedido) => {
        if (pedido.estatus === 'Activo' || !pedido.estatus) {
            setPedidoSeleccionado(pedido);
            setModalOpen(true);
        } else {
            alert("Solo se permite editar pedidos en estado Activo.");
        }
    };

    // Procesa la recepción de mercancía e incrementa el stock [3, 5]
    const handleRecibir = async (pedido, e) => {
        e.stopPropagation(); // Evita abrir el modal al hacer clic en el botón
        const confirmar = window.confirm(`¿Desea procesar el ingreso de mercancía del pedido ${pedido.numero_pedido}?`);
        if (confirmar) {
            try {
                if (pedido.items && Object.keys(pedido.items).length > 0) {
                    for (const [prodId, qty] of Object.entries(pedido.items)) {
                        await db.updateStock(parseInt(prodId), parseInt(qty));
                    }
                }
                await db.put('pedidos', { ...pedido, estatus: 'Cerrado' });
                alert("✅ Pedido procesado exitosamente.");
                cargarRegistros();
            } catch (error) {
                console.error("Error al procesar:", error);
            }
        }
    };

    const styles = {
        container: { display: 'flex', flexDirection: 'column', width: '100%', minHeight: '100vh', backgroundColor: '#fff', boxSizing: 'border-box' },
        header: { display: 'flex', alignItems: 'center', padding: '15px', backgroundColor: '#00BFFF', color: 'white', boxSizing: 'border-box' },
        backArrow: { background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer', marginRight: '10px' },
        title: { fontSize: '20px', fontWeight: 'bold', margin: 0 },
        content: { padding: '20px', display: 'flex', flexDirection: 'column', width: '100%', boxSizing: 'border-box' },
        // Botón "+" redondo y centrado [6]
        addBtnCircle: { 
            width: '55px', 
            height: '55px', 
            borderRadius: '50%', 
            backgroundColor: '#28a745', 
            color: 'white', 
            border: 'none', 
            fontSize: '35px', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            cursor: 'pointer', 
            marginBottom: '20px', 
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)', 
            padding: 0, 
            lineHeight: 0 
        },
        listaContainer: { width: '100%' },
        // Configuración de 3 columnas: Orden, Fecha, Acción/Estatus [7]
        headerRow: { 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr 1fr', 
            backgroundColor: '#f4f4f4', 
            borderBottom: '2px solid #ddd', 
            padding: '10px 5px' 
        },
        headerCell: { fontWeight: 'bold', fontSize: '13px', color: '#333', textAlign: 'left' },
        row: { 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr 1fr', 
            borderBottom: '1px solid #eee', 
            cursor: 'pointer', 
            alignItems: 'center' 
        },
        cell: { padding: '15px 5px', textAlign: 'left', color: '#000', fontSize: '14px' },
        btnRecibir: { backgroundColor: '#28a745', color: 'white', border: 'none', padding: '8px 10px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' },
        estatusCerrado: { color: '#666', fontStyle: 'italic', fontSize: '13px' }
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <button onClick={() => navigate(-1)} style={styles.backArrow}>←</button>
                <h1 style={styles.title}>Pedidos</h1>
            </header>

            <main style={styles.content}>
                <button onClick={handleNuevoPedido} style={styles.addBtnCircle}>+</button>
                
                <div style={styles.listaContainer}>
                    {/* Títulos de las columnas */}
                    <div style={styles.headerRow}>
                        <span style={styles.headerCell}>ORDEN #</span>
                        <span style={styles.headerCell}>FECHA</span>
                        <span style={styles.headerCell}>ESTATUS</span>
                    </div>

                    {loading ? (
                        <p>Cargando registros...</p>
                    ) : (
                        listaPedidos.map((p) => (
                            <div key={p.id} onClick={() => handleSeleccionarPedido(p)} style={styles.row}>
                                <span style={styles.cell}>#{p.numero_pedido}</span>
                                <span style={styles.cell}>{new Date(p.fecha_pedido).toLocaleDateString()}</span>
                                <span style={styles.cell}>
                                    {(p.estatus === 'Activo' || !p.estatus) ? (
                                        <button 
                                            style={styles.btnRecibir} 
                                            onClick={(e) => handleRecibir(p, e)}
                                        >
                                            Recibir
                                        </button>
                                    ) : (
                                        <span style={styles.estatusCerrado}>{p.estatus}</span>
                                    )}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </main>

            {/* Modal de Gestión de Pedidos [8] */}
            {modalOpen && (
                <GestionPedido 
                    pedido={pedidoSeleccionado} 
                    onClose={() => {
                        setModalOpen(false);
                        cargarRegistros();
                    }}
                    onSave={cargarRegistros}
                />
            )}
        </div>
    );
};

export default PedidosComponente;