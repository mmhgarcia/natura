import React, { useState, useEffect } from 'react';
import { db } from '../lib/db/database'; // Acceso a dbTasaBCV [3, 4]

const GestionPedido = ({ pedido, onClose, onSave }) => {
  // Evita el error de zona horaria en Android [5]
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
  const [aplicarDelivery, setAplicarDelivery] = useState(true);
  const [error, setError] = useState('');
  const [totales, setTotales] = useState({ usd: 0, bs: 0 });

  const esVisualizacion = !!pedido && pedido.estatus === 'Cerrado';

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const tasaConfig = await db.getConfigValue('tasa'); 
        const deliveryValor = await db.getConfigValue('delivery');
        const [todosLosProductos, todosLosGrupos] = await Promise.all([
          db.getAll('productos'),
          db.getAll('grupos')
        ]);

        setProductos(todosLosProductos);
        setListaGrupos(todosLosGrupos);

        if (pedido) {
          setFormData({
            numero_pedido: pedido.numero_pedido || '',
            fecha_pedido: pedido.fecha_pedido || '',
            tasa: pedido.tasa || (tasaConfig ? tasaConfig.toString() : ''),
            estatus: pedido.estatus || 'Activo',
            delivery_tasa: pedido.delivery_tasa !== undefined ? pedido.delivery_tasa : (deliveryValor || 0)
          });
          if (pedido.items) setCantidades(pedido.items);
          setAplicarDelivery(pedido.delivery_aplicado ?? true);
        } else {
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
        console.error("Error cargando datos:", err);
      }
    };
    cargarDatos();
  }, [pedido]);

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

      const cargoDelivery = aplicarDelivery ? (parseFloat(formData.delivery_tasa) || 0) : 0;
      const totalUSD = subtotalUSD + cargoDelivery;
      const tasaNum = parseFloat(formData.tasa) || 0;
      setTotales({ usd: totalUSD, bs: totalUSD * tasaNum });
    };

    if (productos.length > 0) calcular();
  }, [cantidades, productos, listaGrupos, formData.tasa, formData.delivery_tasa, aplicarDelivery]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (esVisualizacion) return;
    try {
      const pedidoData = {
        ...formData,
        items: cantidades,
        total_usd: totales.usd,
        total_bs: totales.bs,
        delivery_aplicado: aplicarDelivery,
        updatedAt: new Date().toISOString()
      };

      if (pedido && pedido.id) {
        await db.put('pedidos', { ...pedidoData, id: pedido.id, createdAt: pedido.createdAt });
      } else {
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
        <div style={styles.header}>
          <span style={styles.title}>GESTIÓN DE PEDIDOS</span>
          <button onClick={onClose} style={styles.closeButton}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.content}>
          <div style={styles.topRow}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Pedido #</label>
              <input type="text" value={formData.numero_pedido} readOnly style={styles.inputReadOnly} />
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

          <div style={styles.infoBar}>
            <span>💰 Tasa: {formData.tasa ? parseFloat(formData.tasa).toFixed(2) : '---'}</span>
            <div style={styles.deliveryGroup}>
              <input 
                type="checkbox" 
                checked={aplicarDelivery} 
                onChange={(e) => setAplicarDelivery(e.target.checked)}
                disabled={esVisualizacion}
                style={styles.checkbox}
              />
              <span style={styles.deliveryText}>🚚 Delivery: ${formData.delivery_tasa}</span>
            </div>
          </div>

          <div style={styles.productListContainer}>
            <div style={styles.productListHeader}>Lista de Productos</div>
            <div style={styles.productList}>
              {Object.entries(productosAgrupados).map(([grupo, items]) => (
                <div key={grupo}>
                  <div style={styles.groupTitle}>{grupo.toUpperCase()}</div>
                  {items.map((prod) => {
                    // Criterios de color de Home.jsx [1]
                    const esAgotado = prod.stock === 0;
                    const esBajoStock = prod.stock > 0 && prod.stock <= 5;
                    const badgeColor = esAgotado ? '#ff4d4d' : (esBajoStock ? '#ffa500' : '#28a745');

                    return (
                      <div key={prod.id} style={styles.productItem}>
                        {/* Contenedor para Badge y Nombre alineados a la izquierda */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ ...styles.stockBadgeSmall, backgroundColor: badgeColor }}>
                            {prod.stock}
                          </span>
                          <span style={styles.productName}>{prod.nombre}</span>
                        </div>
                        
                        <div style={styles.quantityControl}>
                          <button 
                            type="button"
                            onClick={() => !esVisualizacion && setCantidades({...cantidades, [prod.id]: Math.max(0, (cantidades[prod.id] || 0) - 1)})} 
                            style={styles.qtyBtn} 
                            disabled={esVisualizacion}
                          >
                            -
                          </button>
                          <input type="text" value={cantidades[prod.id] || 0} readOnly style={styles.qtyInput} />
                          <button 
                            type="button"
                            onClick={() => !esVisualizacion && setCantidades({...cantidades, [prod.id]: (cantidades[prod.id] || 0) + 1})} 
                            style={styles.qtyBtn} 
                            disabled={esVisualizacion}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div style={styles.footer}>
            <button type="button" onClick={() => setCantidades({})} style={styles.limpiarBtn} disabled={esVisualizacion}>Limpiar</button>
            {!esVisualizacion && (
              <button type="submit" style={styles.grabarBtn}>
                {pedido ? "💾 Actualizar" : "💾 Grabar"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 },
  modal: { backgroundColor: '#fff', width: '95%', maxWidth: '500px', maxHeight: '95vh', padding: '15px', borderRadius: '8px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #00BFFF', marginBottom: '8px' },
  title: { fontSize: '16px', fontWeight: 'bold', color: '#000' },
  closeButton: { background: 'none', border: 'none', fontSize: '32px', cursor: 'pointer', minWidth: '44px', color: '#000' },
  content: { display: 'flex', flexDirection: 'column', gap: '8px' },
  topRow: { display: 'flex', flexDirection: 'row', gap: '10px', width: '100%' },
  inputGroup: { display: 'flex', flexDirection: 'column', flex: 1, gap: '2px' },
  label: { fontSize: '14px', fontWeight: 'bold', color: '#000' },
  totalsBar: { display: 'flex', gap: '8px', justifyContent: 'space-between' },
  totalBox: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#e1f5fe', padding: '6px', border: '1px solid #00BFFF', borderRadius: '4px' },
  totalLabel: { fontSize: '11px', fontWeight: 'bold', color: '#000' },
  totalValue: { fontSize: '14px', fontWeight: 'bold', color: '#007bff' },
  infoBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: 'bold', color: '#000', padding: '0 5px' },
  deliveryGroup: { display: 'flex', alignItems: 'center', gap: '5px' },
  checkbox: { width: '18px', height: '18px' },
  deliveryText: { color: '#000' },
  productListContainer: { border: '1px solid #aaa', borderRadius: '4px', overflow: 'hidden', marginTop: '5px' },
  productListHeader: { textAlign: 'center', backgroundColor: '#00BFFF', color: 'white', padding: '4px', fontSize: '13px', fontWeight: 'bold' },
  productList: { height: '260px', overflowY: 'auto', backgroundColor: '#fff' },
  groupTitle: { fontSize: '14px', fontWeight: 'bold', backgroundColor: '#f1f1f1', padding: '6px 10px', color: '#000' },
  productItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderBottom: '1px solid #eee' },
  // NUEVO ESTILO: Badge pequeño para el stock [Basado en 222, 223]
  stockBadgeSmall: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: 'bold',
    border: '1px solid #fff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    flexShrink: 0
  },
  productName: { fontSize: '13px', color: '#000' },
  quantityControl: { display: 'flex', alignItems: 'center', gap: '5px' },
  qtyBtn: { width: '32px', height: '32px', backgroundColor: '#eee', border: '1px solid #ccc', fontWeight: 'bold', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' },
  qtyInput: { width: '40px', textAlign: 'center', border: '1px solid #ccc', padding: '4px', backgroundColor: '#f0f0f0', color: '#000', fontWeight: 'bold' },
  footer: { display: 'flex', gap: '10px', marginTop: '5px' },
  limpiarBtn: { backgroundColor: '#f44336', color: 'white', border: 'none', padding: '12px', borderRadius: '4px', flex: 1, fontWeight: 'bold' },
  grabarBtn: { backgroundColor: '#28a745', color: 'white', border: 'none', padding: '12px', borderRadius: '4px', flex: 1, fontWeight: 'bold' },
  inputSmall: {
    padding: '8px',
    border: '1px solid #aaa',
    borderRadius: '4px',
    width: '100%',
    boxSizing: 'border-box',
    fontSize: '18px',
    color: '#fff',
    textAlign: 'center',
    backgroundColor: '#00BFFF',
    fontWeight: 'bold'
  },
  inputReadOnly: {
    padding: '8px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    width: '100%',
    boxSizing: 'border-box',
    cursor: 'not-allowed',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    backgroundColor: '#555'
  }
};

export default GestionPedido;