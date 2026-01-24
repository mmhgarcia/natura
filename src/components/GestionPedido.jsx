import React, { useState, useEffect } from 'react';
import { db } from '../lib/db/database';
import styles from './GestionPedido.module.css';

const GestionPedido = ({ pedido, onClose, onSave }) => {
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
  const [totales, setTotales] = useState({ usd: 0, bs: 0 });
  const [utilidad, setUtilidad] = useState({ usd: 0, bs: 0 });

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
    const calcularFinanzas = () => {
      let costoTotalUSD = 0;
      let ingresoEstimadoUSD = 0;

      Object.entries(cantidades).forEach(([prodId, qty]) => {
        const producto = productos.find(p => p.id === parseInt(prodId));
        if (producto && qty > 0) {
          const grupo = listaGrupos.find(g => g.nombre.toLowerCase() === producto.grupo.toLowerCase());
          if (grupo) {
            costoTotalUSD += qty * (grupo.costo_$ || 0);
            ingresoEstimadoUSD += qty * (grupo.precio || 0);
          }
        }
      });

      const cargoDelivery = aplicarDelivery ? (parseFloat(formData.delivery_tasa) || 0) : 0;
      const totalPedidoUSD = costoTotalUSD + cargoDelivery;
      const tasaNum = parseFloat(formData.tasa) || 0;
      const utilidadUSD = ingresoEstimadoUSD - totalPedidoUSD;

      setTotales({ usd: totalPedidoUSD, bs: totalPedidoUSD * tasaNum });
      setUtilidad({ usd: utilidadUSD, bs: utilidadUSD * tasaNum });
    };

    if (productos.length > 0) calcularFinanzas();
  }, [cantidades, productos, listaGrupos, formData.tasa, formData.delivery_tasa, aplicarDelivery]);

  const handleRecalcular = async () => {
    try {
      const nuevaTasa = await db.getConfigValue('tasa');
      const nuevoDelivery = await db.getConfigValue('delivery');
      const gruposActualizados = await db.getAll('grupos');
      
      setListaGrupos(gruposActualizados);
      setFormData(prev => ({
        ...prev,
        tasa: nuevaTasa ? nuevaTasa.toString() : prev.tasa,
        delivery_tasa: nuevoDelivery !== null ? nuevoDelivery : prev.delivery_tasa
      }));
      alert("Totales recalculados con éxito.");
    } catch (err) {
      alert("Error al recalcular.");
    }
  };

  const handleLimpiar = () => {
    if (window.confirm("¿Estás seguro de que deseas vaciar todas las cantidades seleccionadas?")) {
      setCantidades({});
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (esVisualizacion) return;

    const mensaje = pedido
      ? `¿Estás seguro de que deseas ACTUALIZAR los cambios en el pedido #${formData.numero_pedido}?`
      : `¿Deseas GRABAR el nuevo pedido #${formData.numero_pedido}?`;

    if (!window.confirm(mensaje)) return;

    const pedidoData = {
      ...formData,
      items: cantidades,
      total_usd: totales.usd,
      total_bs: totales.bs,
      delivery_aplicado: aplicarDelivery,
      updatedAt: new Date().toISOString()
    };

    try {
      if (pedido?.id) {
        await db.put('pedidos', { ...pedidoData, id: pedido.id });
      } else {
        await db.add('pedidos', { ...pedidoData, createdAt: new Date().toISOString() });
      }
      onSave();
      onClose();
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Hubo un error al guardar el pedido.");
    }
  };

  const productosAgrupados = productos.reduce((acc, prod) => {
    const grupo = prod.grupo || 'Otros';
    if (!acc[grupo]) acc[grupo] = [];
    acc[grupo].push(prod);
    return acc;
  }, {});

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <span className={styles.title}>GESTIÓN DE PEDIDOS</span>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.content}>
          <div className={styles.topRow}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Pedido #</label>
              <input
                type="text"
                value={formData.numero_pedido}
                readOnly
                className={styles.inputSmall}
              />
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
            <span>Tasa: {formData.tasa || '---'}</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input
                type="checkbox"
                checked={aplicarDelivery}
                onChange={(e) => setAplicarDelivery(e.target.checked)}
                className={styles.checkbox}
                disabled={esVisualizacion}
              />
              Delivery: ${formData.delivery_tasa}
            </label>
          </div>

          <div className={styles.productListContainer}>
            <div className={styles.productListHeader}>Selección de Productos</div>
            <div className={styles.productList}>
              {Object.entries(productosAgrupados).map(([grupo, items]) => (
                <div key={grupo}>
                  <div className={styles.groupTitle}>{grupo.toUpperCase()}</div>
                  {items.map((prod) => {
                    // Lógica de colores de stock del componente Home [2]
                    const esAgotado = prod.stock === 0;
                    const esBajoStock = prod.stock > 0 && prod.stock <= 5;
                    const badgeColor = esAgotado ? '#ff4d4d' : (esBajoStock ? '#ffa500' : '#28a745');

                    return (
                      <div key={prod.id} className={styles.productItem}>
                        <div 
                          className={styles.stockBadgeSmall} 
                          style={{ backgroundColor: badgeColor }}
                        >
                          {prod.stock}
                        </div>
                        <span className={styles.productName}>{prod.nombre}</span>
                        <div className={styles.quantityControl}>
                          <button
                            type="button"
                            className={styles.qtyBtn}
                            onClick={() => setCantidades({...cantidades, [prod.id]: Math.max(0, (cantidades[prod.id] || 0) - 1)})}
                            disabled={esVisualizacion}
                          >-</button>
                          <span>{cantidades[prod.id] || 0}</span>
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

          <div className={styles.utilidadBar}>
            <div className={styles.utilidadBox}>
              <span className={styles.utilidadLabel}>UTILIDAD EST. $</span>
              <span style={{ fontWeight: 'bold', color: utilidad.usd >= 0 ? '#28a745' : '#f44336' }}>
                ${utilidad.usd.toFixed(2)}
              </span>
            </div>
            <div className={styles.utilidadBox}>
              <span className={styles.utilidadLabel}>UTILIDAD EST. BS</span>
              <span style={{ fontWeight: 'bold', color: utilidad.bs >= 0 ? '#28a745' : '#f44336' }}>
                Bs. {utilidad.bs.toFixed(2)}
              </span>
            </div>
          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.limpiarBtn} onClick={handleLimpiar} disabled={esVisualizacion}>
              Limpiar
            </button>
            <button type="button" className={styles.recalcularBtn} onClick={handleRecalcular}>
              Recalcular
            </button>
            {!esVisualizacion && (
              <button type="submit" className={styles.grabarBtn}>
                {pedido ? "Actualizar" : "Grabar"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default GestionPedido;