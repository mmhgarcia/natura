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
  const [stats, setStats] = useState({
    pedidosActivos: 0,
    pedidosCerrados: 0
  });

  const cargarRegistros = async () => {
    try {
      setLoading(true);
      // Obtener todos los pedidos de la tabla 'pedidos' en IndexedDB [4]
      const datos = await db.getAll('pedidos');

      // Ordenar por número de pedido descendente [4, 5]
      const datosOrdenados = datos.sort((a, b) => {
        const numA = parseInt(a.numero_pedido) || 0;
        const numB = parseInt(b.numero_pedido) || 0;
        return numB - numA;
      });

      setListaPedidos(datosOrdenados);

      // Calcular estadísticas según el estatus [5]
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

  // --- NUEVA FUNCIONALIDAD: INCREMENTAR STOCK AL RECIBIR ---
  const handleRecibirPedido = async (pedido, e) => {
    e.stopPropagation(); // Evita abrir el modal al hacer click en el icono [6]

    // Validación: solo procesar si no ha sido recibido antes [3]
    if (pedido.estatus === 'Cerrado') {
      alert("Este pedido ya fue recibido e ingresado al inventario.");
      return;
    }

    const confirmar = window.confirm(`¿Marcar Pedido #${pedido.numero_pedido} como RECIBIDO?\n\nEsta acción sumará las cantidades al stock actual de cada producto.`);
    
    if (confirmar) {
      try {
        // 1. Recorrer los items del pedido e incrementar el stock [2, 7]
        // pedido.items es un objeto { id_producto: cantidad }
        const actualizaciones = Object.entries(pedido.items).map(([id, cantidad]) => {
          return db.updateStock(parseInt(id), cantidad); // Suma al stock usando el método de la DB [1]
        });

        await Promise.all(actualizaciones);

        // 2. Actualizar el estatus del pedido a 'Cerrado' [8]
        const pedidoActualizado = {
          ...pedido,
          estatus: 'Cerrado',
          updatedAt: new Date().toISOString()
        };
        
        await db.put('pedidos', pedidoActualizado);

        // 3. Refrescar la UI
        alert("✅ Inventario actualizado y pedido marcado como RECIBIDO.");
        await cargarRegistros();
      } catch (error) {
        console.error("Error al procesar la recepción:", error);
        alert("❌ Error crítico al actualizar el inventario.");
      }
    }
  };

  const handleNuevoPedido = () => {
    setPedidoSeleccionado(null);
    setModalOpen(true);
  };

  const handleEliminar = async (pedido, e) => {
    e.stopPropagation();
    // Capa de seguridad: no eliminar pedidos cerrados [9]
    if (pedido.estatus === 'Cerrado') {
      alert("No se puede eliminar un pedido que ya ha sido recibido.");
      return;
    }

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
        <button onClick={handleNuevoPedido} className={styles.addBtnCircle}>+</button>
      </header>

      {/* Barra de Estadísticas [6] */}
      <div className={styles.statsBar}>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{listaPedidos.length}</span>
          <span className={styles.statLabel}>TOTAL</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber} style={{ color: '#27ae60' }}>{stats.pedidosActivos}</span>
          <span className={styles.statLabel}>PENDIENTES</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber} style={{ color: '#3498db' }}>{stats.pedidosCerrados}</span>
          <span className={styles.statLabel}>RECIBIDOS</span>
        </div>
      </div>

      <div className={styles.listaCards}>
        {loading ? (
          <p className={styles.loading}>Cargando registros...</p>
        ) : listaPedidos.length === 0 ? (
          <p className={styles.loading}>No hay pedidos registrados</p>
        ) : (
          listaPedidos.map((p) => (
            <div 
              key={p.id} 
              className={styles.pedidoCard}
              onClick={() => { setPedidoSeleccionado(p); setModalOpen(true); }}
              style={{ borderLeftColor: p.estatus === 'Cerrado' ? '#3498db' : '#27ae60' }}
            >
              <div className={styles.cardHeader}>
                <span className={styles.orderNumber}>#{p.numero_pedido}</span>
                <span className={`${styles.statusBadge} ${p.estatus === 'Cerrado' ? styles.statusCerrado : styles.statusPendiente}`}>
                  {p.estatus === 'Cerrado' ? '✅ RECIBIDO' : '🟢 PENDIENTE'}
                </span>
              </div>
              
              <div className={styles.tasaRow}>
                <span className={styles.tasaLabel}>💰 Tasa BCV aplicada:</span>
                <span className={styles.tasaValue}>{p.tasa || '---'}</span>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.cardDate}>
                  📅 {new Date(p.fecha_pedido).toLocaleDateString('es-ES')}
                </div>
                <div className={styles.cardTotals}>
                  <div className={styles.totalUsd}>${p.total_usd?.toFixed(2)}</div>
                  <div className={styles.totalBs}>Bs. {p.total_bs?.toFixed(2)}</div>
                </div>
              </div>

              <div className={styles.cardActions}>
                {/* Botón Editar / Ver */}
                <span className={styles.actionBtn}>✏️</span>
                
                {/* Botón RECIBIR con la nueva lógica vinculada */}
                <span 
                  className={styles.actionBtn}
                  onClick={(e) => handleRecibirPedido(p, e)}
                  style={{ 
                    opacity: p.estatus === 'Cerrado' ? 0.3 : 1,
                    cursor: p.estatus === 'Cerrado' ? 'not-allowed' : 'pointer',
                    backgroundColor: p.estatus === 'Cerrado' ? '#eee' : '#e8f4fc'
                  }}
                  title="Recibir Pedido e incrementar Stock"
                >
                  📥
                </span>

                <span className={styles.actionBtn}>📤</span>
                
                <button 
                  onClick={(e) => handleEliminar(p, e)}
                  className={styles.deleteBtn}
                  disabled={p.estatus === 'Cerrado'}
                  style={{
                    opacity: p.estatus === 'Cerrado' ? 0.3 : 1,
                    cursor: p.estatus === 'Cerrado' ? 'not-allowed' : 'pointer'
                  }}
                >
                  🗑️
                </button>
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