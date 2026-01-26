import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/db/database';
import GestionPedido from './GestionPedido';
import styles from './Pedidos.module.css';

const PedidosComponente = () => {
  const navigate = useNavigate();
  const [listaPedidos, setListaPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState({ pedidosActivos: 0, pedidosCerrados: 0 });

  const cargarRegistros = async () => {
    try {
      setLoading(true);
      const datos = await db.getAll('pedidos'); [5]
      const datosOrdenados = datos.sort((a, b) => {
        const numA = parseInt(a.numero_pedido) || 0;
        const numB = parseInt(b.numero_pedido) || 0;
        return numB - numA;
      });
      setListaPedidos(datosOrdenados);
      const activos = datosOrdenados.filter(p => p.estatus === 'Activo' || !p.estatus).length;
      const cerrados = datosOrdenados.filter(p => p.estatus === 'Cerrado').length;
      setStats({ pedidosActivos: activos, pedidosCerrados: cerrados });
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarRegistros();
  }, []);

  // --- ACTUALIZACIÓN FASE 5: Lógica para Array de Items (BI) ---
  const handleExportTxt = async (pedido, e) => {
    e.stopPropagation();
    try {
      let contenido = `PEDIDO NATURA ICE\n`;
      contenido += `==============================\n\n`;
      contenido += `Numero: #${pedido.numero_pedido}\n`;
      contenido += `Fecha: ${new Date(pedido.fecha_pedido).toLocaleDateString('es-ES')}\n`;
      contenido += `Tasa BCV: ${pedido.tasa}\n`;
      contenido += `==============================\n`;
      contenido += `PRODUCTOS SOLICITADOS:\n`;
      contenido += `==============================\n\n`;

      let totalUnidades = 0;

      // CAMBIO CLAVE: Recorremos directamente el array de BI [Snapshot histórico]
      pedido.items.forEach((item) => {
        if (item.cantidad > 0) {
          // El nombre ya viene en el item, no hace falta buscar en la tabla 'productos'
          contenido += `${item.cantidad} x ${item.nombre}\n`;
          totalUnidades += item.cantidad;
        }
      });

      const costoDelivery = pedido.delivery_aplicado ? (parseFloat(pedido.delivery_tasa) || 0) : 0;
      
      contenido += `\n==============================\n`;
      contenido += `RESUMEN:\n`;
      contenido += `==============================\n\n`;
      contenido += `Total Unidades: ${totalUnidades}\n`;
      contenido += `Delivery: ${costoDelivery.toFixed(2)}\n`;
      contenido += `----------------------------\n`;
      contenido += `Total USD + Deliv: $${(pedido.total_usd).toFixed(2)}\n`;
      contenido += `Total Bs: Bs. ${pedido.total_bs.toFixed(2)}\n\n`;
      
      contenido += `==============================\n`;
      contenido += `INFORMACION:\n`;
      contenido += `==============================\n\n`;
      contenido += `Distribuidor: Natura Ice\n`;
      contenido += `Generado: ${new Date().toLocaleDateString('es-ES')}\n`;
      contenido += `==============================\n`;

      const blob = new Blob([contenido], { type: 'text/plain' }); [6]
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Pedido_${pedido.numero_pedido}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Error exportando pedido:", error);
      alert("No se pudo generar el archivo de texto.");
    }
  };

  // --- ACTUALIZACIÓN FASE 5: Recepción de pedido con items detallados ---
  const handleRecibirPedido = async (pedido, e) => {
    e.stopPropagation();
    if (pedido.estatus === 'Cerrado' || isProcessing) return;

    const confirmar = window.confirm(`¿Marcar Pedido #${pedido.numero_pedido} como RECIBIDO?\nSe actualizará el stock.`);
    if (!confirmar) return;

    setIsProcessing(true);
    try {
      await db.db.transaction('rw', [db.productos, db.pedidos], async () => {
        // CAMBIO CLAVE: Iteración sobre el array de objetos detallados
        for (const item of pedido.items) {
          // Usamos el productoId guardado en el snapshot del item [2, 7]
          await db.updateStock(item.productoId, item.cantidad);
        }
        
        await db.pedidos.update(pedido.id, {
          estatus: 'Cerrado',
          updatedAt: new Date().toISOString()
        });
      });

      alert("✅ Inventario actualizado exitosamente.");
      await cargarRegistros();
    } catch (error) {
      console.error("Error al recibir pedido:", error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEliminar = async (pedido, e) => {
    e.stopPropagation();
    if (pedido.estatus === 'Cerrado' || isProcessing) return;
    if (window.confirm(`¿Eliminar pedido #${pedido.numero_pedido}?`)) {
      await db.del('pedidos', pedido.id);
      cargarRegistros();
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => navigate(-1)} className={styles.backArrow}>←</button>
        <span className={styles.title}>Pedidos Natura</span>
        <button className={styles.addBtnCircle} onClick={() => { setPedidoSeleccionado(null); setModalOpen(true); }}>+</button>
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

      <div className={styles.listaCards}>
        {loading ? (
          <p className={styles.loading}>Cargando registros...</p>
        ) : (
          listaPedidos.map((p) => (
            <div 
              key={p.id} 
              className={styles.pedidoCard}
              onClick={() => { if(!isProcessing) { setPedidoSeleccionado(p); setModalOpen(true); } }}
              style={{ borderLeftColor: p.estatus === 'Cerrado' ? '#3498db' : '#27ae60' }}
            >
              <div className={styles.cardHeader}>
                <span className={styles.orderNumber}>#{p.numero_pedido}</span>
                <span className={`${styles.statusBadge} ${p.estatus === 'Cerrado' ? styles.statusCerrado : styles.statusPendiente}`}>
                  {p.estatus === 'Cerrado' ? '✅ RECIBIDO' : '🟢 PENDIENTE'}
                </span>
              </div>
              <div className={styles.tasaRow}>
                <span className={styles.tasaLabel}>💰 Tasa:</span>
                <span className={styles.tasaValue}>{p.tasa || '---'}</span>
              </div>
              <div className={styles.cardBody}>
                <span className={styles.cardDate}>{new Date(p.fecha_pedido).toLocaleDateString('es-ES')}</span>
                <div style={{ textAlign: 'right' }}>
                  <div className={styles.totalUsd}>${p.total_usd?.toFixed(2)}</div>
                  <div className={styles.totalBs}>Bs. {p.total_bs?.toFixed(2)}</div>
                </div>
              </div>

              <div className={styles.cardActions}>
                <button 
                  className={styles.actionBtn} 
                  onClick={(e) => { e.stopPropagation(); setPedidoSeleccionado(p); setModalOpen(true); }}
                  disabled={p.estatus === 'Cerrado'}
                >✏️</button>
                <button 
                  className={styles.actionBtn} 
                  onClick={(e) => handleExportTxt(p, e)} 
                  title="Exportar para Proveedor"
                  style={{ backgroundColor: '#fff3cd' }}
                >📄</button>
                <button 
                  className={styles.actionBtn} 
                  onClick={(e) => handleRecibirPedido(p, e)}
                  disabled={p.estatus === 'Cerrado' || isProcessing}
                  style={{ opacity: (p.estatus === 'Cerrado' || isProcessing) ? 0.3 : 1 }}
                >
                  {isProcessing && p.id === pedidoSeleccionado?.id ? '⌛' : '📥'}
                </button>
                <button 
                  className={styles.actionBtn} 
                  onClick={(e) => handleEliminar(p, e)} 
                  disabled={p.estatus === 'Cerrado'}
                >🗑️</button>
              </div>
            </div>
          ))
        )}
      </div>

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