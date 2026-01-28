import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/db/database';
import GestionPedido from './GestionPedido';
import { formatDate } from '../lib/utils.js';
import { ORDER_STATUS } from '../lib/constants';
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

      // OPTIMIZACIÓN: Usar el índice de Dexie para traer los pedidos ya ordenados por ID (o número)
      // Como el ID es autoincremental, el orden inverso del ID suele coincidir con el tiempo.
      // Si queremos exactitud por numero_pedido, usamos ese índice.
      const datosOrdenados = await db.db.pedidos
        .orderBy('id')
        .reverse()
        .toArray();

      setListaPedidos(datosOrdenados);

      const activos = datosOrdenados.filter(p => !p.estatus || p.estatus === ORDER_STATUS.ACTIVE).length;
      const cerrados = datosOrdenados.filter(p => p.estatus === ORDER_STATUS.CLOSED).length;

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
      contenido += `Fecha: ${formatDate(pedido.fecha_pedido)}\n`;
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

      const blob = new Blob([contenido], { type: 'text/plain' });
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
    if (pedido.estatus === ORDER_STATUS.CLOSED || isProcessing) return;

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
          estatus: ORDER_STATUS.CLOSED,
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
    if (pedido.estatus === ORDER_STATUS.CLOSED || isProcessing) return;
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
              onClick={() => { if (!isProcessing) { setPedidoSeleccionado(p); setModalOpen(true); } }}
              style={{ '--status-color': p.estatus === ORDER_STATUS.CLOSED ? '#4f46e5' : '#f39c12' }}
            >
              <div className={styles.cardHeader}>
                <span className={styles.orderNumber}>#{p.numero_pedido}</span>
                <span className={`${styles.statusBadge} ${p.estatus === ORDER_STATUS.CLOSED ? styles.statusCerrado : styles.statusPendiente}`}>
                  {p.estatus === ORDER_STATUS.CLOSED ? 'Recibido' : 'Pendiente'}
                </span>
              </div>

              <div className={styles.tasaRow}>
                <span>Tasa BCV:</span>
                <span>{p.tasa || '---'}</span>
              </div>

              <div className={styles.cardBody}>
                <span className={styles.cardDate}>{formatDate(p.fecha_pedido)}</span>
                <div className={styles.totalSection}>
                  <span className={styles.totalUsd}>${p.total_usd?.toFixed(2)}</span>
                  <div className={styles.utilidadUsdCard}>+${p.utilidad_usd?.toFixed(2)} UTIL.</div>
                </div>
              </div>

              <div className={styles.cardActions}>
                <button
                  className={styles.actionBtn}
                  onClick={(e) => { e.stopPropagation(); setPedidoSeleccionado(p); setModalOpen(true); }}
                  disabled={p.estatus === ORDER_STATUS.CLOSED}
                  title="Editar"
                >✏️</button>
                <button
                  className={styles.actionBtn}
                  onClick={(e) => handleExportTxt(p, e)}
                  title="Exportar TXT"
                >📄</button>
                <button
                  className={styles.actionBtn}
                  onClick={(e) => handleRecibirPedido(p, e)}
                  disabled={p.id === pedidoSeleccionado?.id && isProcessing}
                  title="Recibir Pedido"
                >
                  {isProcessing && p.id === pedidoSeleccionado?.id ? '⌛' : '📥'}
                </button>
                <button
                  className={styles.actionBtn}
                  onClick={(e) => handleEliminar(p, e)}
                  disabled={p.estatus === ORDER_STATUS.CLOSED}
                  title="Eliminar"
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