import React, { useState, useEffect } from 'react';
import { db } from '../lib/db/database'; // Acceso a la base de datos dbTasaBCV [1]

const GestionPedido = ({ pedido, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        numero_pedido: '',
        fecha_pedido: new Date().toISOString().split('T'), // [2]
        tasa: '',
        estatus: 'Activo'
    });

    const [productos, setProductos] = useState([]);
    const [listaGrupos, setListaGrupos] = useState([]);
    const [cantidades, setCantidades] = useState({});
    const [error, setError] = useState('');

    const esVisualizacion = !!pedido; // [2]

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const tasaConfig = await db.getConfigValue('tasa'); // [2]
                const [todosLosProductos, todosLosGrupos] = await Promise.all([
                    db.getAll('productos'),
                    db.getAll('grupos')
                ]);

                setProductos(todosLosProductos);
                setListaGrupos(todosLosGrupos);

                if (pedido) {
                    // Sincronización: Actualiza el calendario con la fecha del pedido recibido [3]
                    setFormData({
                        numero_pedido: pedido.numero_pedido || '',
                        fecha_pedido: pedido.fecha_pedido || '',
                        tasa: pedido.tasa || (tasaConfig ? tasaConfig.toString() : ''),
                        estatus: pedido.estatus || 'Activo'
                    });
                    if (pedido.items) setCantidades(pedido.items);
                } else {
                    const hoy = new Date().toISOString().split('T');
                    const ultimoPedido = await db.pedidos.orderBy('id').last();
                    const siguienteNumero = ultimoPedido 
                        ? (parseInt(ultimoPedido.numero_pedido) + 1).toString() 
                        : "1";

                    setFormData(prev => ({
                        ...prev,
                        numero_pedido: siguienteNumero,
                        fecha_pedido: hoy,
                        tasa: tasaConfig ? tasaConfig.toString() : ''
                    }));
                }
            } catch (err) {
                console.error("Error al cargar datos iniciales:", err);
            }
        };
        cargarDatos();
    }, [pedido]);

    const calcularTotales = () => {
        let totalUSD = 0;
        Object.entries(cantidades).forEach(([prodId, qty]) => {
            const producto = productos.find(p => p.id === parseInt(prodId));
            if (producto && qty > 0) {
                const grupo = listaGrupos.find(g => g.nombre.toLowerCase() === producto.grupo.toLowerCase());
                const costo = grupo ? (grupo.costo_$ || 0) : 0; // [6]
                totalUSD += qty * costo;
            }
        });
        const tasaNum = parseFloat(formData.tasa) || 0;
        return { usd: totalUSD, bs: totalUSD * tasaNum };
    };

    const { usd, bs } = calcularTotales();

    const handleIncrement = (id) => {
        if (esVisualizacion) return;
        setCantidades(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    };

    const handleDecrement = (id) => {
        if (esVisualizacion) return;
        setCantidades(prev => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) - 1) }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (esVisualizacion) return;
        try {
            const pedidoData = { ...formData, items: cantidades, total_usd: usd, total_bs: bs };
            await db.add('pedidos', pedidoData); // [7]
            onSave();
            onClose();
        } catch (err) {
            setError('Error al grabar el pedido: ' + err.message);
        }
    };

    const getCostoGrupo = (nombreGrupo) => {
        const grupo = listaGrupos.find(g => g.nombre.toLowerCase() === nombreGrupo.toLowerCase());
        return grupo ? (grupo.costo_$ ? grupo.costo_$.toFixed(2) : "0.00") : "0.00";
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
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Tasa (BCV)</label>
                            <input type="text" value={formData.tasa} disabled style={styles.inputReadOnly} />
                        </div>
                    </div>

                    <div style={styles.totalsBar}>
                        <div style={styles.totalBox}>
                            <span style={styles.totalLabel}>Total $:</span>
                            <span style={styles.totalValue}>{usd.toFixed(2)}</span>
                        </div>
                        <div style={styles.totalBox}>
                            <span style={styles.totalLabel}>Total Bs:</span>
                            <span style={styles.totalValue}>{bs.toFixed(2)}</span>
                        </div>
                    </div>

                    <div style={styles.productListContainer}>
                        <div style={styles.productListHeader}>Lista de Productos</div>
                        <div style={styles.productList}>
                            {Object.entries(productosAgrupados).map(([grupo, items]) => (
                                <div key={grupo}>
                                    <div style={styles.groupTitle}>
                                        <span>{grupo.toUpperCase()}</span>
                                        <span style={styles.groupPrice}>(${getCostoGrupo(grupo)})</span>
                                    </div>
                                    {items.map((prod) => (
                                        <div key={prod.id} style={styles.productItem}>
                                            <div style={styles.productName}>{prod.nombre} (ID: {prod.id})</div>
                                            <div style={styles.productDetails}>
                                                <span style={styles.stockText}>Stock: {prod.stock}</span>
                                                <div style={styles.quantityControl}>
                                                    <button type="button" onClick={() => handleDecrement(prod.id)} style={styles.qtyBtn} disabled={esVisualizacion}>-</button>
                                                    <input 
                                                        type="number" 
                                                        value={cantidades[prod.id] || 0} 
                                                        onChange={(e) => !esVisualizacion && setCantidades({...cantidades, [prod.id]: parseInt(e.target.value) || 0})}
                                                        style={styles.qtyInput}
                                                        disabled={esVisualizacion}
                                                    />
                                                    <button type="button" onClick={() => handleIncrement(prod.id)} style={styles.qtyBtn} disabled={esVisualizacion}>+</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={styles.footer}>
                        <button type="button" onClick={() => setCantidades({})} style={{...styles.limpiarBtn, opacity: esVisualizacion ? 0.5 : 1}} disabled={esVisualizacion}>Limpiar</button>
                        <button type="submit" style={{...styles.grabarBtn, opacity: esVisualizacion ? 0.5 : 1}} disabled={esVisualizacion}>Grabar</button>
                    </div>
                    {error && <p style={styles.error}>{error}</p>}
                </form>
            </div>
        </div>
    );
};

const styles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 },
    modal: { backgroundColor: '#fff', width: '95%', maxWidth: '500px', maxHeight: '95vh', border: '1px solid #ccc', padding: '10px', borderRadius: '4px', display: 'flex', flexDirection: 'column' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #00BFFF', marginBottom: '10px' },
    title: { fontSize: '16px', fontWeight: 'bold', color: '#000', margin: 0 },
    closeButton: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#000' },
    content: { display: 'flex', flexDirection: 'column', gap: '10px' },
    topRow: { display: 'flex', gap: '8px', justifyContent: 'space-between' },
    inputGroup: { display: 'flex', flexDirection: 'column', flex: 1, gap: '4px' },
    label: { fontSize: '12px', fontWeight: 'bold', color: '#000' },
    inputSmall: { padding: '6px', border: '1px solid #aaa', fontSize: '13px', color: '#000', backgroundColor: '#fff', width: '100%', boxSizing: 'border-box' },
    inputReadOnly: { padding: '6px', border: '1px solid #ccc', fontSize: '13px', color: '#555', backgroundColor: '#f0f0f0', width: '100%', boxSizing: 'border-box', cursor: 'not-allowed' },
    totalsBar: { display: 'flex', gap: '10px', justifyContent: 'space-between', padding: '5px 0' },
    totalBox: { flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#e1f5fe', padding: '8px', border: '1px solid #00BFFF', borderRadius: '4px' },
    totalLabel: { fontSize: '13px', fontWeight: 'bold', color: '#000' },
    totalValue: { fontSize: '14px', fontWeight: 'bold', color: '#007bff' },
    productListContainer: { border: '1px solid #aaa', borderRadius: '2px' },
    productListHeader: { textAlign: 'center', color: '#00BFFF', padding: '5px', borderBottom: '1px solid #aaa', fontWeight: 'bold' },
    productList: { height: '275px', overflowY: 'auto', backgroundColor: '#fff' },
    groupTitle: { fontSize: '18px', fontWeight: 'bold', backgroundColor: '#f1f1f1', padding: '8px 10px', color: '#000', display: 'flex', justifyContent: 'space-between' },
    groupPrice: { color: '#007bff', fontSize: '16px' },
    productItem: { padding: '8px 10px', borderBottom: '1px solid #eee' },
    productName: { fontSize: '14px', color: '#000' },
    productDetails: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    stockText: { fontSize: '12px', color: '#333' },
    quantityControl: { display: 'flex', alignItems: 'center', gap: '4px' },
    qtyBtn: { width: '30px', height: '30px', backgroundColor: '#eee', border: '1px solid #ccc', cursor: 'pointer', fontWeight: 'bold', fontSize: '18px', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    qtyInput: { width: '40px', textAlign: 'center', border: '1px solid #ccc', padding: '4px', color: '#000', backgroundColor: '#fff' },
    footer: { display: 'flex', gap: '15px', marginTop: '5px' },
    limpiarBtn: { backgroundColor: '#f44336', color: 'white', border: 'none', padding: '10px 25px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', flex: 1 },
    grabarBtn: { backgroundColor: '#28a745', color: 'white', border: 'none', padding: '10px 25px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', flex: 1 },
    error: { color: 'red', fontSize: '12px', textAlign: 'center' }
};

export default GestionPedido;