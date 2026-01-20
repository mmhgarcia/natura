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

  // ==================== CARGAR DATOS ====================
  
  const cargarRegistros = async () => {
    try {
      setLoading(true);
      const datos = await db.getAll('pedidos'); 
      // Ordenar por número de pedido (más recientes primero)
      const datosOrdenados = datos.sort((a, b) => {
        const numA = parseInt(a.numero_pedido) || 0;
        const numB = parseInt(b.numero_pedido) || 0;
        return numB - numA;
      });
      setListaPedidos(datosOrdenados);
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
      alert("❌ Error al cargar los pedidos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarRegistros();
  }, []);

  // ==================== FUNCIONES BÁSICAS ====================
  
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

  // ==================== RECIBIR PEDIDO ====================
  
  const handleRecibir = async (pedido, e) => {
    e.stopPropagation(); 
    
    const confirmar = window.confirm(
      `¿Procesar ingreso del pedido #${pedido.numero_pedido}?\n\n` +
      `✅ Esto incrementará el stock y marcará como "Cerrado".`
    );
    
    if (!confirmar) return;
    
    try {
      // Incrementar stock de cada producto
      if (pedido.items && Object.keys(pedido.items).length > 0) {
        for (const [prodId, qty] of Object.entries(pedido.items)) {
          const cantidadNum = parseInt(qty);
          if (cantidadNum > 0) {
            await db.updateStock(parseInt(prodId), cantidadNum);
          }
        }
      }

      // Marcar como 'Cerrado'
      await db.put('pedidos', { 
        ...pedido, 
        estatus: 'Cerrado',
        fechaRecepcion: new Date().toISOString()
      });
      
      alert(`✅ Pedido #${pedido.numero_pedido} recibido. Stock actualizado.`);
      cargarRegistros();
    } catch (error) {
      console.error("Error al recibir pedido:", error);
      alert(`❌ Error: ${error.message}`);
    }
  };

  // ==================== ELIMINAR PEDIDO ====================
  
  const handleEliminar = async (pedido, e) => {
    e.stopPropagation(); 
    
    // Validar estado
    if (pedido.estatus === 'Cerrado') {
      alert("❌ Pedido ya procesado. No se puede eliminar.");
      return;
    }
    
    const totalItems = Object.keys(pedido.items || {}).length;
    
    const confirmar = window.confirm(
      `⚠️ ¿ELIMINAR PEDIDO #${pedido.numero_pedido}?\n\n` +
      `Items: ${totalItems} producto(s)\n` +
      `Total: $${pedido.total_usd?.toFixed(2) || '0.00'}\n\n` +
      `Esta acción NO se puede deshacer.`
    );
    
    if (!confirmar) return;
    
    try {
      await db.del('pedidos', pedido.id);
      alert(`✅ Pedido #${pedido.numero_pedido} eliminado.`);
      cargarRegistros();
    } catch (error) {
      console.error("Error eliminando:", error);
      alert(`❌ Error: ${error.message}`);
    }
  };

  // ==================== EXPORTAR PEDIDO ====================
  
  const exportarPedido = async (pedido) => {
    try {
      // 1. Obtener productos de la base de datos
      const productos = await db.getAll('productos');
      
      // 2. Preparar lista de productos del pedido
      const items = pedido.items || {};
      const listaProductos = [];
      let totalUnidades = 0;
      
      // 3. Para cada item, buscar su nombre
      for (const [productoId, cantidad] of Object.entries(items)) {
        if (cantidad > 0) {
          // Buscar el producto por ID
          const producto = productos.find(p => p.id == productoId);
          
          // Usar nombre si existe, si no, usar "Producto X"
          const nombre = producto?.nombre || `Producto ${productoId}`;
          
          listaProductos.push(`${cantidad} x ${nombre}`);
          totalUnidades += parseInt(cantidad);
        }
      }
      
      // 4. Crear el contenido del archivo
      const contenido = `
PEDIDO NATURA ICE
=====================

Número: #${pedido.numero_pedido}
Fecha: ${new Date(pedido.fecha_pedido).toLocaleDateString('es-ES')}
Tasa BCV: ${pedido.tasa || 'N/A'}

=====================
PRODUCTOS SOLICITADOS:
=====================

${listaProductos.join('\n')}

=====================
RESUMEN:
=====================

Total Unidades: ${totalUnidades}
Total USD: $${pedido.total_usd?.toFixed(2) || '0.00'}
Total Bs: Bs. ${pedido.total_bs?.toFixed(2) || '0.00'}

=====================
INFORMACIÓN:
=====================

Distribuidor: Natura Ice
Contacto: (Tu número aquí)
Fecha requerida: Próxima semana

=====================
Generado: ${new Date().toLocaleDateString('es-ES')}
=====================
      `.trim();
      
      // 5. Crear y descargar archivo
      const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `Pedido_${pedido.numero_pedido}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 6. Limpiar y confirmar
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
      alert(`✅ Pedido #${pedido.numero_pedido} exportado\n\nArchivo listo para enviar al proveedor.`);
      
    } catch (error) {
      console.error('Error:', error);
      alert(`❌ Error al exportar: ${error.message}`);
    }
  };

  // ==================== UTILIDADES ====================
  
  const formatearFecha = (fechaString) => {
    if (!fechaString) return 'N/A';
    try {
      return new Date(fechaString).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return fechaString;
    }
  };

  const calcularEstadisticas = () => {
    const pedidosActivos = listaPedidos.filter(p => p.estatus === 'Activo' || !p.estatus).length;
    const pedidosCerrados = listaPedidos.filter(p => p.estatus === 'Cerrado').length;
    
    return { pedidosActivos, pedidosCerrados };
  };

  const stats = calcularEstadisticas();

  // ==================== ESTILOS ====================
  
  const styles = {
    container: { 
      display: 'flex', 
      flexDirection: 'column', 
      width: '100%', 
      minHeight: '100vh', 
      backgroundColor: '#f5f7fa', 
      margin: 0, 
      padding: 0, 
      boxSizing: 'border-box' 
    },
    
    header: { 
      display: 'flex', 
      alignItems: 'center', 
      padding: '15px 20px', 
      backgroundColor: '#2c3e50', 
      color: 'white', 
      width: '100%', 
      boxSizing: 'border-box',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    },
    
    backArrow: { 
      background: 'none', 
      border: 'none', 
      color: 'white', 
      fontSize: '24px', 
      cursor: 'pointer', 
      marginRight: '15px',
      padding: '5px 10px',
      borderRadius: '6px',
      transition: 'all 0.2s'
    },
    
    title: { 
      fontSize: '20px', 
      fontWeight: 'bold', 
      margin: 0,
      flex: 1
    },
    
    statsBar: {
      display: 'flex',
      justifyContent: 'space-around',
      padding: '15px 20px',
      backgroundColor: 'white',
      borderBottom: '1px solid #eaeaea',
      marginBottom: '15px',
      flexWrap: 'wrap',
      gap: '15px'
    },
    
    statCard: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '12px 20px',
      backgroundColor: '#f8f9fa',
      borderRadius: '10px',
      minWidth: '100px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    },
    
    statNumber: {
      fontSize: '24px',
      fontWeight: 'bold',
      marginBottom: '5px'
    },
    
    statLabel: {
      fontSize: '12px',
      color: '#7f8c8d',
      textAlign: 'center'
    },
    
    content: { 
      padding: '0 20px 20px', 
      display: 'flex', 
      flexDirection: 'column', 
      width: '100%', 
      boxSizing: 'border-box' 
    },
    
    addBtnCircle: { 
      width: '60px', 
      height: '60px', 
      borderRadius: '50%', 
      backgroundColor: '#27ae60', 
      color: 'white', 
      border: 'none', 
      fontSize: '36px', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      cursor: 'pointer', 
      boxShadow: '0 4px 12px rgba(39, 174, 96, 0.3)', 
      padding: 0, 
      lineHeight: 0,
      transition: 'all 0.3s',
      margin: '0 auto 20px'
    },
    
    headerRow: { 
      display: 'grid', 
      gridTemplateColumns: '100px 100px 120px 200px',
      backgroundColor: '#34495e', 
      borderBottom: '2px solid #2c3e50', 
      padding: '14px 10px',
      fontWeight: 'bold',
      fontSize: '13px',
      color: 'white',
      borderRadius: '8px 8px 0 0'
    },
    
    headerCell: { 
      textAlign: 'left',
      padding: '0 5px'
    },
    
    listaContainer: { 
      width: '100%',
      minHeight: '200px',
      backgroundColor: 'white',
      borderRadius: '0 0 8px 8px',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    },
    
    row: { 
      display: 'grid', 
      gridTemplateColumns: '100px 100px 120px 200px',
      borderBottom: '1px solid #f0f0f0', 
      cursor: 'pointer', 
      alignItems: 'center',
      padding: '12px 10px',
      transition: 'all 0.2s'
    },
    
    rowHover: {
      backgroundColor: '#f8f9ff'
    },
    
    cell: { 
      padding: '8px 5px', 
      textAlign: 'left', 
      color: '#2c3e50', 
      fontSize: '14px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    },
    
    pedidoNumero: {
      fontWeight: 'bold',
      fontSize: '15px',
      color: '#2c3e50'
    },
    
    pedidoEstatus: {
      fontSize: '11px',
      marginTop: '3px',
      padding: '3px 8px',
      borderRadius: '12px',
      display: 'inline-block',
      width: 'fit-content',
      fontWeight: '500'
    },
    
    estatusActivo: {
      backgroundColor: '#d5f4e6',
      color: '#27ae60',
      border: '1px solid #27ae60'
    },
    
    estatusCerrado: {
      backgroundColor: '#e8f4fc',
      color: '#3498db',
      border: '1px solid #3498db'
    },
    
    totalContainer: {
      display: 'flex',
      flexDirection: 'column'
    },
    
    totalBS: {
      fontWeight: 'bold',
      fontSize: '14px',
      color: '#2c3e50'
    },
    
    totalUSD: {
      fontSize: '12px',
      color: '#7f8c8d',
      marginTop: '2px'
    },
    
    accionesContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '6px'
    },
    
    btnBase: {
      border: 'none',
      padding: '6px 10px',
      borderRadius: '6px',
      fontSize: '12px',
      cursor: 'pointer',
      fontWeight: 'bold',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '4px',
      transition: 'all 0.2s',
      minWidth: '70px'
    },
    
    btnRecibir: {
      backgroundColor: '#27ae60',
      color: 'white'
    },
    
    btnEliminar: {
      backgroundColor: '#e74c3c',
      color: 'white'
    },
    
    btnExportar: {
      backgroundColor: '#3498db',
      color: 'white'
    },
    
    loadingContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 20px',
      color: '#7f8c8d'
    },
    
    loadingSpinner: {
      border: '4px solid #f3f3f3',
      borderTop: '4px solid #3498db',
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      animation: 'spin 1s linear infinite',
      marginBottom: '20px'
    },
    
    emptyState: {
      textAlign: 'center',
      padding: '60px 20px',
      color: '#7f8c8d'
    },
    
    emptyStateIcon: {
      fontSize: '60px',
      marginBottom: '20px',
      opacity: 0.3
    }
  };

  // ==================== RENDER ====================
  
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button 
          onClick={() => navigate(-1)} 
          style={styles.backArrow}
          onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          title="Volver"
        >
          ←
        </button>
        <h1 style={styles.title}>📦 Gestión de Pedidos</h1>
      </div>

      {/* Estadísticas */}
      <div style={styles.statsBar}>
        <div style={styles.statCard}>
          <div style={{...styles.statNumber, color: '#2c3e50'}}>{listaPedidos.length}</div>
          <div style={styles.statLabel}>TOTAL PEDIDOS</div>
        </div>
        
        <div style={styles.statCard}>
          <div style={{...styles.statNumber, color: '#27ae60'}}>{stats.pedidosActivos}</div>
          <div style={styles.statLabel}>PENDIENTES</div>
        </div>
        
        <div style={styles.statCard}>
          <div style={{...styles.statNumber, color: '#3498db'}}>{stats.pedidosCerrados}</div>
          <div style={styles.statLabel}>RECIBIDOS</div>
        </div>
      </div>

      {/* Contenido principal */}
      <div style={styles.content}>
        {/* Botón nuevo pedido */}
        <button 
          style={styles.addBtnCircle}
          onClick={handleNuevoPedido}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.1)';
            e.target.style.boxShadow = '0 6px 16px rgba(39, 174, 96, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 4px 12px rgba(39, 174, 96, 0.3)';
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
              <div style={{ fontSize: '18px', marginBottom: '10px' }}>No hay pedidos registrados</div>
              <div style={{ fontSize: '14px', color: '#95a5a6' }}>
                Crea tu primer pedido usando el botón "+" verde
              </div>
            </div>
          ) : (
            listaPedidos.map((p) => {
              const isActive = p.estatus === 'Activo' || !p.estatus;
              const isHovered = hoveredRow === p.id;
              const itemsCount = Object.keys(p.items || {}).length;
              
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
                      {isActive ? '🟢 Pendiente' : '✅ Recibido'}
                    </div>
                  </div>
                  
                  {/* Columna 2: Fecha */}
                  <div style={styles.cell}>
                    {formatearFecha(p.fecha_pedido)}
                    <div style={{ fontSize: '11px', color: '#7f8c8d', marginTop: '2px' }}>
                      {itemsCount} producto{itemsCount !== 1 ? 's' : ''}
                    </div>
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
                      {/* Botón Recibir (solo para activos) */}
                      {isActive && (
                        <button 
                          style={{...styles.btnBase, ...styles.btnRecibir}}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#219653'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#27ae60'}
                          onClick={(e) => handleRecibir(p, e)}
                          title="Marcar como recibido (incrementa stock)"
                        >
                          📥 Recibir
                        </button>
                      )}
                      
                      {/* Botón Eliminar (solo para activos) */}
                      {isActive && (
                        <button 
                          style={{...styles.btnBase, ...styles.btnEliminar}}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#c0392b'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#e74c3c'}
                          onClick={(e) => handleEliminar(p, e)}
                          title="Eliminar pedido pendiente"
                        >
                          🗑️ Eliminar
                        </button>
                      )}
                      
                      {/* Botón Exportar (siempre disponible) */}
                      <button 
                        style={{...styles.btnBase, ...styles.btnExportar}}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#2980b9'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#3498db'}
                        onClick={(e) => {
                          e.stopPropagation();
                          exportarPedido(p);
                        }}
                        title="Exportar pedido para enviar al proveedor"
                      >
                        📤 Exportar
                      </button>
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

      {/* Estilos CSS para animaciones */}
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