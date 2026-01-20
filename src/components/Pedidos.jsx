import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/db/database'; 
import GestionPedido from './GestionPedido';

const PedidosComponente = () => {
  const navigate = useNavigate();
  const [listaPedidos, setListaPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);

  const cargarRegistros = async () => {
    try {
      setLoading(true);
      const datos = await db.getAll('pedidos'); 
      // Ordenar por número de pedido descendente (más recientes primero)
      const datosOrdenados = datos.sort((a, b) => {
        if (a.numero_pedido && b.numero_pedido) {
          return parseInt(b.numero_pedido) - parseInt(a.numero_pedido);
        }
        return b.id - a.id;
      });
      setListaPedidos(datosOrdenados);
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
      alert("❌ Error al cargar los pedidos. Revise la conexión.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarRegistros();
  }, []);

  const handleNuevoPedido = () => {
    setPedidoSeleccionado(null);
    setModalOpen(true);
  };

  const handleSeleccionarPedido = (pedido) => {
    if (pedido.estatus === 'Activo' || !pedido.estatus) {
      setPedidoSeleccionado(pedido);
      setModalOpen(true);
    } else {
      alert("ℹ️ Solo se permite editar pedidos en estado Activo.");
    }
  };

  // Lógica para recibir pedido (incrementar stock)
  const handleRecibir = async (pedido, e) => {
    e.stopPropagation(); 
    
    const confirmar = window.confirm(
      `¿Desea procesar el ingreso de mercancía del pedido #${pedido.numero_pedido}?\n\n` +
      `✅ Esto incrementará el stock de los productos:\n` +
      `• ${Object.keys(pedido.items || {}).length} producto(s)\n` +
      `• Estado cambiará a "Cerrado"`
    );
    
    if (!confirmar) return;
    
    try {
      // 1. Recorrer items del pedido para incrementar stock
      if (pedido.items && Object.keys(pedido.items).length > 0) {
        for (const [prodId, qty] of Object.entries(pedido.items)) {
          const cantidadNum = parseInt(qty);
          if (cantidadNum > 0) {
            await db.updateStock(parseInt(prodId), cantidadNum);
          }
        }
      }

      // 2. Marcar pedido como 'Cerrado'
      await db.put('pedidos', { 
        ...pedido, 
        estatus: 'Cerrado',
        fechaRecepcion: new Date().toISOString()
      });
      
      // 3. Notificar éxito
      alert(`✅ Pedido #${pedido.numero_pedido} procesado exitosamente.\nEl stock ha sido actualizado.`);
      
      // 4. Refrescar lista
      cargarRegistros();
    } catch (error) {
      console.error("Error al procesar el pedido:", error);
      alert(`❌ Error crítico al procesar el pedido:\n${error.message}`);
    }
  };

  // NUEVA FUNCIÓN: Eliminar pedido activo
  const handleEliminar = async (pedido, e) => {
    e.stopPropagation(); 
    
    // Validar que el pedido esté activo
    if (pedido.estatus === 'Cerrado') {
      alert("❌ No se puede eliminar un pedido procesado.\n\n" +
            "Este pedido está en estado 'Cerrado', lo que significa que:\n" +
            "• El stock ya fue actualizado\n" +
            "• Los productos están en inventario\n\n" +
            "Para reversar, use la función 'Ajuste de inventario' en Productos.");
      return;
    }
    
    // Mostrar detalles de confirmación
    const totalItems = Object.keys(pedido.items || {}).length;
    const totalUSD = pedido.total_usd ? `$${pedido.total_usd.toFixed(2)}` : "$0.00";
    const totalBS = pedido.total_bs ? `Bs. ${pedido.total_bs.toFixed(2)}` : "Bs. 0.00";
    
    const confirmar = window.confirm(
      `⚠️ ¿ELIMINAR PERMANENTEMENTE?\n\n` +
      `Pedido #${pedido.numero_pedido}\n` +
      `Fecha: ${new Date(pedido.fecha_pedido).toLocaleDateString()}\n` +
      `Items: ${totalItems} producto(s)\n` +
      `Total: ${totalUSD} | ${totalBS}\n` +
      `Estado: ${pedido.estatus || 'Activo'}\n\n` +
      `Esta acción NO se puede deshacer.`
    );
    
    if (!confirmar) return;
    
    try {
      // Opcional: Registrar acción para auditoría
      const registroAuditoria = {
        tipo: 'ELIMINACION_PEDIDO',
        pedidoId: pedido.id,
        pedidoNumero: pedido.numero_pedido,
        fechaEliminacion: new Date().toISOString(),
        datos: JSON.stringify({
          items: pedido.items,
          total_usd: pedido.total_usd,
          total_bs: pedido.total_bs,
          tasa: pedido.tasa
        })
      };
      
      // Intentar guardar en tabla 'auditoria' si existe
      try {
        if (db.auditoria) {
          await db.add('auditoria', registroAuditoria);
        }
      } catch (auditError) {
        console.warn("No se pudo registrar auditoría:", auditError);
      }
      
      // Eliminar el pedido principal
      await db.del('pedidos', pedido.id);
      
      // Feedback al usuario
      alert(`✅ Pedido #${pedido.numero_pedido} eliminado exitosamente.`);
      
      // Recargar la lista
      cargarRegistros();
    } catch (error) {
      console.error("Error eliminando pedido:", error);
      alert(`❌ Error al eliminar el pedido:\n${error.message}`);
    }
  };

  // Función para formatear fecha
  const formatearFecha = (fechaString) => {
    if (!fechaString) return 'N/A';
    try {
      const fecha = new Date(fechaString);
      return fecha.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return fechaString;
    }
  };

  // Calcular estadísticas
  const pedidosActivos = listaPedidos.filter(p => p.estatus === 'Activo' || !p.estatus).length;
  const pedidosCerrados = listaPedidos.filter(p => p.estatus === 'Cerrado').length;

  const styles = {
    container: { 
      display: 'flex', 
      flexDirection: 'column', 
      width: '100%', 
      minHeight: '100vh', 
      backgroundColor: '#fff', 
      margin: 0, 
      padding: 0, 
      boxSizing: 'border-box' 
    },
    
    header: { 
      display: 'flex', 
      alignItems: 'center', 
      padding: '15px', 
      backgroundColor: '#00BFFF', 
      color: 'white', 
      width: '100%', 
      boxSizing: 'border-box',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    
    backArrow: { 
      background: 'none', 
      border: 'none', 
      color: 'white', 
      fontSize: '24px', 
      cursor: 'pointer', 
      marginRight: '10px',
      padding: '5px 10px',
      borderRadius: '4px',
      transition: 'background-color 0.2s'
    },
    
    backArrowHover: {
      backgroundColor: 'rgba(255,255,255,0.2)'
    },
    
    title: { 
      fontSize: '20px', 
      fontWeight: 'bold', 
      margin: 0,
      flex: 1
    },
    
    statsBar: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '10px 20px',
      backgroundColor: '#f8f9fa',
      borderBottom: '1px solid #dee2e6',
      fontSize: '13px',
      color: '#495057'
    },
    
    statItem: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    },
    
    statNumber: {
      fontWeight: 'bold',
      fontSize: '16px'
    },
    
    statLabel: {
      fontSize: '11px',
      color: '#6c757d'
    },
    
    content: { 
      padding: '20px', 
      display: 'flex', 
      flexDirection: 'column', 
      width: '100%', 
      boxSizing: 'border-box' 
    },
    
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
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)', 
      padding: 0, 
      lineHeight: 0,
      alignSelf: 'flex-end',
      transition: 'transform 0.2s, box-shadow 0.2s'
    },
    
    addBtnCircleHover: {
      transform: 'scale(1.05)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
    },
    
    headerRow: { 
      display: 'grid', 
      gridTemplateColumns: '0.8fr 0.8fr 1fr 1.4fr', 
      backgroundColor: '#f4f4f4', 
      borderBottom: '2px solid #ddd', 
      padding: '12px 8px',
      fontWeight: 'bold',
      fontSize: '13px',
      color: '#333',
      position: 'sticky',
      top: '60px',
      zIndex: 50
    },
    
    headerCell: { 
      fontWeight: 'bold', 
      fontSize: '13px', 
      color: '#333', 
      textAlign: 'left',
      padding: '0 5px'
    },
    
    listaContainer: { 
      width: '100%',
      minHeight: '200px'
    },
    
    row: { 
      display: 'grid', 
      gridTemplateColumns: '0.8fr 0.8fr 1fr 1.4fr',
      borderBottom: '1px solid #eee', 
      cursor: 'pointer', 
      alignItems: 'center',
      padding: '12px 8px',
      transition: 'background-color 0.2s',
      position: 'relative'
    },
    
    rowHover: {
      backgroundColor: '#f8f9fa'
    },
    
    cell: { 
      padding: '8px 5px', 
      textAlign: 'left', 
      color: '#000', 
      fontSize: '14px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    },
    
    pedidoNumero: {
      fontWeight: 'bold',
      fontSize: '15px'
    },
    
    pedidoEstatus: {
      fontSize: '11px',
      marginTop: '3px',
      padding: '2px 6px',
      borderRadius: '10px',
      display: 'inline-block',
      width: 'fit-content'
    },
    
    estatusActivo: {
      backgroundColor: '#d4edda',
      color: '#155724'
    },
    
    estatusCerrado: {
      backgroundColor: '#e2e3e5',
      color: '#383d41',
      fontStyle: 'italic'
    },
    
    totalContainer: {
      display: 'flex',
      flexDirection: 'column'
    },
    
    totalBS: {
      fontWeight: 'bold',
      fontSize: '14px'
    },
    
    totalUSD: {
      fontSize: '11px',
      color: '#007bff',
      marginTop: '2px'
    },
    
    accionesContainer: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap'
    },
    
    btnRecibir: { 
      backgroundColor: '#28a745', 
      color: 'white', 
      border: 'none', 
      padding: '6px 10px', 
      borderRadius: '4px', 
      fontSize: '12px', 
      cursor: 'pointer', 
      fontWeight: 'bold',
      minWidth: '70px',
      transition: 'background-color 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '4px'
    },
    
    btnRecibirHover: {
      backgroundColor: '#218838'
    },
    
    btnEliminar: { 
      backgroundColor: '#dc3545', 
      color: 'white', 
      border: 'none', 
      padding: '6px 10px', 
      borderRadius: '4px', 
      fontSize: '12px', 
      cursor: 'pointer', 
      fontWeight: 'bold',
      minWidth: '36px',
      transition: 'background-color 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    
    btnEliminarHover: {
      backgroundColor: '#c82333'
    },
    
    btnEliminarDisabled: {
      backgroundColor: '#6c757d',
      opacity: 0.5,
      cursor: 'not-allowed'
    },
    
    loadingContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      color: '#666'
    },
    
    loadingSpinner: {
      border: '3px solid #f3f3f3',
      borderTop: '3px solid #00BFFF',
      borderRadius: '50%',
      width: '30px',
      height: '30px',
      animation: 'spin 1s linear infinite',
      marginBottom: '15px'
    },
    
    emptyState: {
      textAlign: 'center',
      padding: '40px 20px',
      color: '#6c757d',
      fontSize: '16px'
    },
    
    emptyStateIcon: {
      fontSize: '48px',
      marginBottom: '15px',
      opacity: 0.5
    },
    
    // Estilos para animación de eliminación
    '@keyframes spin': {
      '0%': { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' }
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button 
          onClick={() => navigate(-1)} 
          style={styles.backArrow}
          onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          title="Volver"
        >
          ←
        </button>
        <h1 style={styles.title}>📋 Gestión de Pedidos</h1>
      </div>

      {/* Barra de estadísticas */}
      <div style={styles.statsBar}>
        <div style={styles.statItem}>
          <span style={{...styles.statNumber, color: '#00BFFF'}}>{listaPedidos.length}</span>
          <span style={styles.statLabel}>TOTAL</span>
        </div>
        <div style={styles.statItem}>
          <span style={{...styles.statNumber, color: '#28a745'}}>{pedidosActivos}</span>
          <span style={styles.statLabel}>ACTIVOS</span>
        </div>
        <div style={styles.statItem}>
          <span style={{...styles.statNumber, color: '#6c757d'}}>{pedidosCerrados}</span>
          <span style={styles.statLabel}>CERRADOS</span>
        </div>
      </div>

      {/* Contenido principal */}
      <div style={styles.content}>
        <button 
          style={styles.addBtnCircle}
          onClick={handleNuevoPedido}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.05)';
            e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
          }}
          title="Crear nuevo pedido"
        >
          +
        </button>

        {/* Cabecera de la tabla */}
        <div style={styles.headerRow}>
          <div style={styles.headerCell}>PEDIDO</div>
          <div style={styles.headerCell}>FECHA</div>
          <div style={styles.headerCell}>TOTAL</div>
          <div style={styles.headerCell}>ACCIONES</div>
        </div>

        {/* Lista de pedidos */}
        <div style={styles.listaContainer}>
          {loading ? (
            <div style={styles.loadingContainer}>
              <div style={styles.loadingSpinner}></div>
              <div>Cargando pedidos...</div>
            </div>
          ) : listaPedidos.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyStateIcon}>📭</div>
              <div>No hay pedidos registrados</div>
              <div style={{ fontSize: '14px', marginTop: '10px' }}>
                Crea tu primer pedido usando el botón "+" verde
              </div>
            </div>
          ) : (
            listaPedidos.map((p) => {
              const isActive = p.estatus === 'Activo' || !p.estatus;
              const isHovered = hoveredRow === p.id;
              
              return (
                <div 
                  key={p.id} 
                  style={{
                    ...styles.row,
                    ...(isHovered ? styles.rowHover : {})
                  }}
                  onClick={() => handleSeleccionarPedido(p)}
                  onMouseEnter={() => setHoveredRow(p.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  {/* Columna 1: Número de pedido y estado */}
                  <div style={styles.cell}>
                    <div style={styles.pedidoNumero}>#{p.numero_pedido}</div>
                    <div style={{
                      ...styles.pedidoEstatus,
                      ...(isActive ? styles.estatusActivo : styles.estatusCerrado)
                    }}>
                      {isActive ? '🟢 Activo' : '✅ Cerrado'}
                    </div>
                  </div>
                  
                  {/* Columna 2: Fecha */}
                  <div style={styles.cell}>
                    {formatearFecha(p.fecha_pedido)}
                  </div>
                  
                  {/* Columna 3: Totales */}
                  <div style={styles.cell}>
                    <div style={styles.totalContainer}>
                      <span style={styles.totalBS}>
                        Bs. {p.total_bs ? p.total_bs.toFixed(2) : "0.00"}
                      </span>
                      <span style={styles.totalUSD}>
                        $ {p.total_usd ? p.total_usd.toFixed(2) : "0.00"}
                      </span>
                    </div>
                  </div>
                  
                  {/* Columna 4: Botones de acción */}
                  <div style={styles.cell}>
                    <div style={styles.accionesContainer}>
                      {isActive ? (
                        <>
                          <button 
                            style={styles.btnRecibir}
                            onClick={(e) => handleRecibir(p, e)}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#218838'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#28a745'}
                            title="Recibir pedido e incrementar stock"
                          >
                            📥 Recibir
                          </button>
                          
                          <button 
                            style={styles.btnEliminar}
                            onClick={(e) => handleEliminar(p, e)}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#c82333'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#dc3545'}
                            title="Eliminar pedido activo"
                          >
                            🗑️ Eliminar
                          </button>
                        </>
                      ) : (
                        <span style={{...styles.estatusCerrado, padding: '6px 10px'}}>
                          Procesado
                          <button 
                            style={{...styles.btnEliminar, ...styles.btnEliminarDisabled}}
                            title="Pedido ya procesado - No se puede eliminar"
                            disabled
                          >
                            🗑️
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal de gestión de pedidos */}
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

      {/* Estilos CSS en línea para animaciones */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PedidosComponente;