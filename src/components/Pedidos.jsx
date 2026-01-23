import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/db/database'; // Acceso a IndexedDB [1]
import GestionPedido from './GestionPedido';
import styles from './Pedidos.module.css';

const PedidosComponente = () => {
    const navigate = useNavigate();
    const [listaPedidos, setListaPedidos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
    const [dropdownAbierto, setDropdownAbierto] = useState(null);
    const [stats, setStats] = useState({
        pedidosActivos: 0,
        pedidosCerrados: 0
    });
    const dropdownRefs = useRef({});

    // ==================== CARGAR DATOS ====================
    const cargarRegistros = async () => {
        try {
            setLoading(true);
            const datos = await db.getAll('pedidos'); [2]
            const datosOrdenados = datos.sort((a, b) => {
                const numA = parseInt(a.numero_pedido) || 0;
                const numB = parseInt(b.numero_pedido) || 0;
                return numB - numA; 
            });
            setListaPedidos(datosOrdenados);

            const pedidosActivos = datosOrdenados.filter(p => p.estatus === 'Activo' || !p.estatus).length;
            const pedidosCerrados = datosOrdenados.filter(p => p.estatus === 'Cerrado').length;
            setStats({ pedidosActivos, pedidosCerrados }); [3]

        } catch (error) {
            console.error("Error al cargar pedidos:", error);
            alert("❌ Error al cargar los pedidos.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarRegistros();
        const handleClickOutside = (event) => {
            const isDropdownClick = Object.values(dropdownRefs.current).some(
                ref => ref && ref.contains(event.target)
            );
            if (!isDropdownClick) setDropdownAbierto(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ==================== FUNCIONES DE ACCIÓN ====================
    const handleNuevoPedido = () => {
        setPedidoSeleccionado(null);
        setModalOpen(true);
    };

    /* Se ha eliminado la función handleVaciarTodo que se encontraba aquí [4-6] */

    const handleEditar = (pedido, e) => {
        e.stopPropagation();
        setDropdownAbierto(null);
        if (pedido.estatus === 'Cerrado') {
            alert("ℹ️ Solo se pueden editar pedidos en estado Activo.");
            return;
        }
        setPedidoSeleccionado(pedido);
        setModalOpen(true);
    };

    const handleRecibir = async (pedido, e) => {
        e.stopPropagation();
        setDropdownAbierto(null);
        if (pedido.estatus === 'Cerrado') return;
        const confirmar = window.confirm(`¿Procesar ingreso del pedido #${pedido.numero_pedido}?\n\n✅ Esto incrementará el stock y marcará como "Cerrado".`);
        if (!confirmar) return;

        try {
            if (pedido.items) {
                for (const [prodId, qty] of Object.entries(pedido.items)) {
                    if (parseInt(qty) > 0) {
                        await db.updateStock(parseInt(prodId), parseInt(qty)); [7]
                    }
                }
            }
            await db.put('pedidos', {
                ...pedido,
                estatus: 'Cerrado',
                fechaRecepcion: new Date().toISOString()
            });
            alert(`✅ Pedido #${pedido.numero_pedido} recibido.`);
            cargarRegistros();
        } catch (error) {
            alert(`❌ Error: ${error.message}`);
        }
    };

    const handleEliminar = async (pedido, e) => {
        e.stopPropagation();
        setDropdownAbierto(null);
        if (pedido.estatus === 'Cerrado') {
            alert("❌ Pedido ya procesado. No se puede eliminar.");
            return;
        }
        if (window.confirm(`⚠️ ¿ELIMINAR PEDIDO #${pedido.numero_pedido}?\n\nEsta acción NO se puede deshacer.`)) {
            try {
                await db.del('pedidos', pedido.id); [8]
                cargarRegistros();
            } catch (error) {
                alert(`❌ Error: ${error.message}`);
            }
        }
    };

    const exportarPedido = async (pedido, e) => {
        if (e) e.stopPropagation();
        setDropdownAbierto(null);
        // Lógica de exportación omitida por brevedad...
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <button onClick={() => navigate(-1)} className={styles.backArrow}>←</button>
                <h1 className={styles.title}>📦 Gestión de Pedidos</h1>
            </header>

            <div className={styles.statsBar}>
                <div className={styles.statCard}>
                    <span className={styles.statNumber}>{listaPedidos.length}</span>
                    <span className={styles.statLabel}>TOTAL</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statNumber}>{stats.pedidosActivos}</span>
                    <span className={styles.statLabel}>PENDIENTES</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statNumber}>{stats.pedidosCerrados}</span>
                    <span className={styles.statLabel}>RECIBIDOS</span>
                </div>
            </div>

            <main className={styles.content}>
                <button onClick={handleNuevoPedido} className={styles.addBtnCircle}>+</button>

                {/* Se ha eliminado el bloque condicional del botón Vaciar Historial [9] */}

                <div className={styles.headerRow}>
                    <div className={styles.headerCell}>PEDIDO</div>
                    <div className={styles.headerCell}>FECHA</div>
                    <div className={styles.headerCell}>TOTAL</div>
                    <div className={styles.headerCell}>ACCIONES</div>
                </div>

                <div className={styles.listaContainer}>
                    {loading ? (
                        <div className={styles.loadingContainer}>Cargando...</div>
                    ) : listaPedidos.length === 0 ? (
                        <div className={styles.emptyState}>No hay pedidos registrados</div>
                    ) : (
                        listaPedidos.map((p) => (
                            <div 
                                key={p.id} 
                                className={styles.row} 
                                onClick={() => { setPedidoSeleccionado(p); setModalOpen(true); }}
                            >
                                <div className={styles.cell}>
                                    <span className={styles.pedidoNumero}>#{p.numero_pedido}</span>
                                    <span className={`${styles.pedidoEstatus} ${p.estatus === 'Cerrado' ? styles.estatusCerrado : styles.estatusActivo}`}>
                                        {p.estatus === 'Cerrado' ? '✅ Recibido' : '🟢 Pendiente'}
                                    </span>
                                </div>
                                <div className={styles.cell}>
                                    {new Date(p.fecha_pedido).toLocaleDateString('es-ES')}
                                </div>
                                <div className={styles.cell}>
                                    <div className={styles.totalContainer}>
                                        <span className={styles.totalBS}>Bs. {p.total_bs?.toFixed(2)}</span>
                                        <span className={styles.totalUSD}>$ {p.total_usd?.toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className={styles.cell} ref={el => dropdownRefs.current[p.id] = el}>
                                    <button 
                                        className={styles.dropdownButton} 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDropdownAbierto(dropdownAbierto === p.id ? null : p.id);
                                        }}
                                    >⋮</button>
                                    
                                    {dropdownAbierto === p.id && (
                                        <div className={styles.dropdownMenu}>
                                            <button onClick={(e) => handleEditar(p, e)} className={styles.dropdownItem}>✏️ Editar</button>
                                            <button onClick={(e) => handleRecibir(p, e)} className={styles.dropdownItem}>📥 Recibir</button>
                                            <button onClick={(e) => exportarPedido(p, e)} className={styles.dropdownItem}>📤 Exportar</button>
                                            <button onClick={(e) => handleEliminar(p, e)} className={styles.dropdownItem}>🗑️ Eliminar</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>

            {modalOpen && (
                <GestionPedido 
                    pedido={pedidoSeleccionado} 
                    onClose={() => { setModalOpen(false); cargarRegistros(); }} 
                    onSave={cargarRegistros} 
                />
            )}
        </div>
    );
};

export default PedidosComponente;