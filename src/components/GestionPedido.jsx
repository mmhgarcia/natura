import React, { useState, useEffect } from 'react';
import { db } from '../lib/db/database'; 
import styles from './GestionPedido.module.css';

const GestionPedido = ({ pedido, onClose, onSave }) => {
  const getLocalToday = () => new Date().toLocaleDateString('en-CA');

  // Estados del formulario y datos
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
  
  // Estados de cálculo financiero
  const [totales, setTotales] = useState({ usd: 0, bs: 0 });
  const [utilidad, setUtilidad] = useState({ usd: 0, bs: 0 });

  const esVisualizacion = !!pedido && pedido.estatus === 'Cerrado';

  // Carga inicial de datos desde IndexedDB (dbTasaBCV) [1-3]
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
            tasa: tasaConfig ? tasaConfig.toString() : '',
            delivery_tasa: deliveryValor || 0
          }));
        }
      } catch (err) {
        console.error("Error cargando datos de IndexedDB:", err);
      }
    };
    cargarDatos();
  }, [pedido]);

  // Cálculo de totales y utilidad en tiempo real [4, 5]
  useEffect(() => {
    const calcularFinanzas = () => {
      let costoTotalUSD = 0;
      let ingresoEstimadoUSD = 0;

      Object.entries(cantidades).forEach(([prodId, qty]) => {
        const producto = productos.find(p => p.id === parseInt(prodId));
        if (producto && qty > 0) {
          // Normalización para evitar errores de coincidencia de grupo
          const grupo = listaGrupos.find(g => g.nombre.toLowerCase() === producto.grupo.toLowerCase());
          if (grupo) {
            costoTotalUSD += qty * (grupo.costo_$ || 0); // Basado en versión 5 de la DB [5]
            ingresoEstimadoUSD += qty * (grupo.precio || 0);
          }
        }
      });

      const cargoDelivery = aplicarDelivery ? (parseFloat(formData.delivery_tasa) || 0) : 0;
      
      // El total del pedido es el costo invertido + delivery si aplica
      const totalPedidoUSD = costoTotalUSD + cargoDelivery;
      const tasaNum = parseFloat(formData.tasa) || 0;

      // Utilidad: Lo que se cobraría al vender menos lo invertido en el pedido
      const utilidadUSD = ingresoEstimadoUSD - totalPedidoUSD;

      setTotales({ usd: totalPedidoUSD, bs: totalPedidoUSD * tasaNum });
      setUtilidad({ usd: utilidadUSD, bs: utilidadUSD * tasaNum });
    };

    if (productos.length > 0) calcularFinanzas();
  }, [cantidades, productos, listaGrupos, formData.tasa, formData.delivery_tasa, aplicarDelivery]);

  // Confirmación para limpiar el pedido
  const handleLimpiar = () => {
    if (window.confirm("¿Estás seguro de que deseas vaciar todas las cantidades seleccionadas?")) {
      setCantidades({});
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (esVisualizacion) return;
    const pedidoData = { 
      ...formData, 
      items: cantidades, 
      total_usd: totales.usd, 
      total_bs: totales.bs, 
      delivery_aplicado: aplicarDelivery,
      updatedAt: new Date().toISOString() 
    };
    
    if (pedido?.id) await db.put('pedidos', { ...pedidoData, id: pedido.id });
    else await db.add('pedidos', { ...pedidoData, createdAt: new Date().toISOString() });
    
    onSave(); 
    onClose();
  };

  const productosAgrupados = productos.reduce((acc, prod) => {
    const grupo = prod.grupo || 'Otros';
    if (!acc[grupo]) acc[grupo] = [];
    acc[grupo].push(prod);
    return acc;
  }, {});

  return (
    <div className={styles.overlay}>
      <form className={styles.modal} onSubmit={handleSubmit}>
        <div className={styles.header}>
          <span className={styles.title}>GESTIÓN DE PEDIDOS</span>
          <button type="button" className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.content}>
          <div className={styles.topRow}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Pedido #</label>
              <input value={formData.numero_pedido} readOnly className={styles.inputReadOnly} />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Fecha</label>
              <input 
                type="date" 
                value={formData.fecha_pedido} 
                onChange={(e) => setFormData({...formData, fecha_pedido: e.target.value})}
                className={esVisualizacion ? styles.inputReadOnly : styles.inputSmall}
                disabled={esVisualizacion}
              />
            </div>
          </div>

          <div className={styles.totalsBar}>
            <div className={styles.totalBox}>
              <span className={styles.totalLabel}>TOTAL PEDIDO $</span>
              <span className={styles.totalValue}>{totales.usd.toFixed(2)}</span>
            </div>
            <div className={styles.totalBox}>
              <span className={styles.totalLabel}>TOTAL PEDIDO BS</span>
              <span className={styles.totalValue}>{totales.bs.toFixed(2)}</span>
            </div>
          </div>

          <div className={styles.infoBar}>
            <span>💰 Tasa: {formData.tasa || '---'}</span>
            <div className={styles.deliveryGroup}>
              <input 
                type="checkbox" 
                checked={aplicarDelivery} 
                onChange={(e) => setAplicarDelivery(e.target.checked)}
                className={styles.checkbox}
                disabled={esVisualizacion}
              />
              <span className={styles.deliveryText}>🚚 Delivery: ${formData.delivery_tasa}</span>
            </div>
          </div>

          <div className={styles.productListContainer}>
            <div className={styles.productListHeader}>Selección de Productos</div>
            <div className={styles.productList}>
              {Object.entries(productosAgrupados).map(([grupo, items]) => (
                <div key={grupo}>
                  <div className={styles.groupTitle}>{grupo.toUpperCase()}</div>
                  {items.map((prod) => {
                    const badgeColor = prod.stock === 0 ? '#ff4d4d' : (prod.stock <= 5 ? '#ffa500' : '#28a745');
                    return (
                      <div key={prod.id} className={styles.productItem}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div className={styles.stockBadgeSmall} style={{ backgroundColor: badgeColor }}>{prod.stock}</div>
                          <span className={styles.productName}>{prod.nombre}</span>
                        </div>
                        <div className={styles.quantityControl}>
                          <button 
                            type="button" 
                            className={styles.qtyBtn}
                            onClick={() => setCantidades({...cantidades, [prod.id]: Math.max(0, (cantidades[prod.id] || 0) - 1)})}
                            disabled={esVisualizacion}
                          >-</button>
                          <span className={styles.qtyInput}>{cantidades[prod.id] || 0}</span>
                          <button 
                            type="button" 
                            className={styles.qtyBtn}
                            onClick={() => setCantidades({...cantidades, [prod.id]: (cantidades[prod.id] || 0) + 1})}
                            disabled={esVisualizacion}
                          >+</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Barra de Utilidad Estimada (Debajo de la lista) */}
          <div className={styles.utilidadBar}>
            <div className={styles.utilidadBox}>
              <span className={styles.utilidadLabel}>UTILIDAD EST. $</span>
              <span className={styles.utilidadValue} style={{ color: utilidad.usd >= 0 ? '#28a745' : '#f44336' }}>
                ${utilidad.usd.toFixed(2)}
              </span>
            </div>
            <div className={styles.utilidadBox}>
              <span className={styles.utilidadLabel}>UTILIDAD EST. BS</span>
              <span className={styles.utilidadValue} style={{ color: utilidad.bs >= 0 ? '#28a745' : '#f44336' }}>
                Bs. {utilidad.bs.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button type="button" onClick={handleLimpiar} className={styles.limpiarBtn} disabled={esVisualizacion}>
            Limpiar
          </button>
          {!esVisualizacion && (
            <button type="submit" className={styles.grabarBtn}>
              {pedido ? "💾 Actualizar" : "💾 Grabar"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default GestionPedido;