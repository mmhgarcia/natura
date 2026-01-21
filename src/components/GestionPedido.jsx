import React, { useState, useEffect } from 'react';
import { db } from '../lib/db/database'; // Persistent IndexedDB: dbTasaBCV [1, 7]

const GestionPedido = ({ pedido, onClose, onSave }) => {
    // Prevents the "day minus one" bug by using local ISO string format [History]
    const getLocalToday = () => new Date().toLocaleDateString('en-CA');

    const [formData, setFormData] = useState({
        numero_pedido: '',
        fecha_pedido: getLocalToday(),
        tasa: '',
        estatus: 'Activo',
        delivery_tasa: 0
    });

    const [productos, setProductos] = useState([]);
    const [listaGrupos, setListaGrupos] = useState([]);
    const [cantidades, setCantidades] = useState({});
    const [error, setError] = useState('');
    const [totales, setTotales] = useState({ usd: 0, bs: 0 });

    const esVisualizacion = !!pedido && pedido.estatus === 'Cerrado';

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                // Fetch settings from the 'config' table [8]
                const tasaConfig = await db.getConfigValue('tasa');
                const deliveryValor = await db.getConfigValue('delivery');

                const [todosLosProductos, todosLosGrupos] = await Promise.all([
                    db.getAll('productos'),
                    db.getAll('grupos')
                ]);

                setProductos(todosLosProductos);
                setListaGrupos(todosLosGrupos);

                if (pedido) {
                    // EDIT MODE logic [4]
                    setFormData({
                        numero_pedido: pedido.numero_pedido || '',
                        fecha_pedido: pedido.fecha_pedido || '',
                        tasa: pedido.tasa || (tasaConfig ? tasaConfig.toString() : ''),
                        estatus: pedido.estatus || 'Activo',
                        delivery_tasa: pedido.delivery_tasa !== undefined ? pedido.delivery_tasa : (deliveryValor || 0)
                    });
                    if (pedido.items) setCantidades(pedido.items);
                } else {
                    // NEW ORDER MODE logic [9]
                    const ultimoPedido = await db.pedidos.orderBy('id').last();
                    const siguienteNumero = ultimoPedido ? (parseInt(ultimoPedido.numero_pedido) + 1).toString() : "1";

                    setFormData(prev => ({
                        ...prev,
                        numero_pedido: siguienteNumero,
                        fecha_pedido: getLocalToday(),
                        tasa: tasaConfig ? tasaConfig.toString() : '',
                        delivery_tasa: deliveryValor || 0
                    }));
                }
            } catch (err) {
                console.error("Error loading initial data:", err);
            }
        };
        cargarDatos();
    }, [pedido]);

    // Recalculates totals in real-time when selections or costs change [10, 11]
    useEffect(() => {
        const calcular = () => {
            let subtotalUSD = 0;
            Object.entries(cantidades).forEach(([prodId, qty]) => {
                const producto = productos.find(p => p.id === parseInt(prodId));
                if (producto && qty > 0) {
                    const grupo = listaGrupos.find(g => g.nombre.toLowerCase() === producto.grupo.toLowerCase());
                    const costo = grupo ? (grupo.costo_$ || 0) : 0;
                    subtotalUSD += qty * costo;
                }
            });

            const totalUSD = subtotalUSD + (parseFloat(formData.delivery_tasa) || 0);
            const tasaNum = parseFloat(formData.tasa) || 0;
            
            setTotales({
                usd: totalUSD,
                bs: totalUSD * tasaNum
            });
        };

        if (productos.length > 0) calcular();
    }, [cantidades, productos, listaGrupos, formData.tasa, formData.delivery_tasa]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (esVisualizacion) return;

        try {
            const pedidoData = {
                ...formData,
                items: cantidades,
                total_usd: totales.usd,
                total_bs: totales.bs,
                updatedAt: new Date().toISOString()
            };

            if (pedido && pedido.id) {
                // UPDATE RECORD in dbTasaBCV [12]
                await db.put('pedidos', { ...pedidoData, id: pedido.id, createdAt: pedido.createdAt });
            } else {
                // ADD NEW RECORD in dbTasaBCV [13]
                pedidoData.createdAt = new Date().toISOString();
                await db.add('pedidos', pedidoData);
            }
            onSave();
            onClose();
        } catch (err) {
            setError(`Error: ${err.message}`);
        }
    };

    const productosAgrupados = productos.reduce((acc, prod) => {
        const grupo = prod.grupo || 'Otros';
        if (!acc[grupo]) acc[grupo] = [];
        acc[grupo].push(prod);
        return acc;
    }, {});

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <header style={styles.header}>
                    <span style={styles.title}>GESTIÓN DE PEDIDOS</span>
                    <button onClick={onClose} style={styles.closeButton}>×</button>
                </header>

                <form onSubmit={handleSubmit} style={styles.content}>
                    <div style={styles.topRow}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Pedido #</label>
                            {/* Order # styled at 18px and Bold [History] */}
                            <input type="text" value={formData.numero_pedido} disabled style={styles.inputReadOnly} />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Fecha</label>
                            <input 
                                type="date"
                                value={formData.fecha_pedido}
                                onChange={(e) => setFormData({...formData, fecha_pedido: e.target.value})}
                                style={esVisualizacion ? styles.inputReadOnly : styles.inputSmall}
                                disabled={esVisualizacion}
                            />
                        </div>
                    </div>

                    <div style={styles.totalsBar}>
                        <div style={styles.totalBox}>
                            <span style={styles.totalLabel}>Total US$:</span>
                            <span style={styles.totalValue}>{totales.usd.toFixed(2)}</span>
                        </div>
                        <div style={styles.totalBox}>
                            <span style={styles.totalLabel}>Total Bs:</span>
                            <span style={styles.totalValue}>{totales.bs.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* BCV Rate on left and Delivery aligned RIGHT in BLACK [History] */}
                    <div style={styles.tasaIzquierda}>
                        <span>💰 Tasa BCV: {formData.tasa ? parseFloat(formData.tasa).toFixed(2) : '---'}</span>
                        <span style={styles.deliveryInline}>🚚 Delivery $: {formData.delivery_tasa ? parseFloat(formData.delivery_tasa).toFixed(2) : '0.00'}</span>
                    </div>

                    <div style={styles.productListContainer}>
                        <div style={styles.productListHeader}>Lista de Productos</div>
                        <div style={styles.productList}>
                            {Object.entries(productosAgrupados).map(([grupo, items]) => (
                                <div key={grupo}>
                                    <div style={styles.groupTitle}>{grupo.toUpperCase()}</div>
                                    {items.map((prod) => (
                                        <div key={prod.id} style={styles.productItem}>
                                            <div style={styles.productName}>{prod.nombre}</div>
                                            <div style={styles.quantityControl}>
                                                <button type="button" onClick={() => !esVisualizacion && setCantidades({...cantidades, [prod.id]: Math.max(0, (cantidades[prod.id] || 0) - 1)})} style={styles.qtyBtn} disabled={esVisualizacion}>-</button>
                                                {/* Qty Input with Light Grey background and Black text [History] */}
                                                <input type="number" value={cantidades[prod.id] || 0} readOnly style={styles.qtyInput} />
                                                <button type="button" onClick={() => !esVisualizacion && setCantidades({...cantidades, [prod.id]: (cantidades[prod.id] || 0) + 1})} style={styles.qtyBtn} disabled={esVisualizacion}>+</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={styles.footer}>
                        <button type="button" onClick={() => setCantidades({})} style={styles.limpiarBtn} disabled={esVisualizacion}>Limpiar</button>
                        <button type="submit" style={styles.grabarBtn} disabled={esVisualizacion}>
                            {pedido ? "💾 Actualizar" : "💾 Grabar"}
                        </button>
                    </div>
                    {error && <p style={styles.error}>{error}</p>}
                </form>
            </div>
        </div>
    );
};

const styles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 },
    modal: { backgroundColor: '#fff', width: '95%', maxWidth: '500px', maxHeight: '95vh', padding: '15px', borderRadius: '8px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #00BFFF', marginBottom: '10px', width: '100%' },
    title: { fontSize: '16px', fontWeight: 'bold', color: '#000', margin: 0 },
    // Permanent visibility fix for mobile "X" [History]
    closeButton: { 
        background: 'none', border: 'none', fontSize: '32px', cursor: 'pointer', color: '#000', 
        padding: '0 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
        minWidth: '44px', height: '44px', flexShrink: 0, marginLeft: '10px' 
    },
    content: { display: 'flex', flexDirection: 'column', gap: '10px' },
    topRow: { display: 'flex', flexDirection: 'row', gap: '10px', width: '100%' },
    inputGroup: { display: 'flex', flexDirection: 'column', flex: 1, gap: '4px' },
    label: { fontSize: '14px', fontWeight: 'bold', color: '#333', display: 'block', flexShrink: 0 },
    inputSmall: { padding: '8px', border: '1px solid #aaa', borderRadius: '4px', fontSize: '14px', width: '100%', boxSizing: 'border-box' },
    inputReadOnly: { padding: '8px', backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: '4px', width: '100%', boxSizing: 'border-box', cursor: 'not-allowed', fontSize: '18px', fontWeight: 'bold', color: '#000' },
    totalsBar: { display: 'flex', flexDirection: 'row', gap: '8px', justifyContent: 'space-between', width: '100%' },
    totalBox: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: '#e1f5fe', padding: '8px', border: '1px solid #00BFFF', borderRadius: '4px' },
    totalLabel: { fontSize: '12px', fontWeight: 'bold', color: '#000' },
    totalValue: { fontSize: '14px', fontWeight: 'bold', color: '#007bff' },
    // UPDATED: space-between aligns Delivery to the RIGHT [History]
    
    tasaIzquierda: { 
        display: 'flex', 
        justifyContent: 'space-between', 
        width: '100%', 
        fontSize: '14px', 
        fontWeight: 'bold', 
        color: '#2c3e50', 
        marginBottom: '5px', 
        paddingLeft: '5px',
        paddingRight: '5px',
        boxSizing: 'border-box'
    },
    // UPDATED: Text color changed to BLACK [History]
    deliveryInline: { color: '#000' },
    productListContainer: { border: '1px solid #aaa', borderRadius: '4px', overflow: 'hidden' },
    productListHeader: { textAlign: 'center', backgroundColor: '#00BFFF', color: 'white', padding: '5px', fontWeight: 'bold' },
    productList: { height: '280px', overflowY: 'auto' },
    groupTitle: { fontSize: '14px', fontWeight: 'bold', backgroundColor: '#f1f1f1', padding: '8px 10px' },
    productItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderBottom: '1px solid #eee' },
    productName: { fontSize: '13px', color: '#333' },
    quantityControl: { display: 'flex', alignItems: 'center', gap: '5px' },
    qtyBtn: { 
        width: '32px', height: '32px', backgroundColor: '#eee', border: '1px solid #ccc', 
        cursor: 'pointer', fontWeight: 'bold', fontSize: '20px', display: 'flex', 
        alignItems: 'center', justifyContent: 'center', padding: 0, lineHeight: 0, color: '#000' 
    },
    qtyInput: { width: '40px', textAlign: 'center', border: '1px solid #ccc', padding: '4px', backgroundColor: '#f0f0f0', color: '#000', fontSize: '14px', fontWeight: 'bold' },
    footer: { display: 'flex', gap: '10px', marginTop: '10px' },
    limpiarBtn: { backgroundColor: '#f44336', color: 'white', border: 'none', padding: '12px', borderRadius: '4px', flex: 1, fontWeight: 'bold' },
    grabarBtn: { backgroundColor: '#28a745', color: 'white', border: 'none', padding: '12px', borderRadius: '4px', flex: 1, fontWeight: 'bold' },
    error: { color: 'red', textAlign: 'center', fontSize: '12px' }
};

export default GestionPedido;