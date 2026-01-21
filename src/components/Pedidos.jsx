import React, { useState, useEffect, useRef } from 'react';
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
  const [hoveredRow, setHoveredRow] = useState(null);
  const [dropdownAbierto, setDropdownAbierto] = useState(null);
  const [stats, setStats] = useState({
    pedidosActivos: 0,
    pedidosCerrados: 0
  });
  const dropdownRefs = useRef({});

  // ==================== CARGAR DATOS ====================
  
  const cargarRegistros = async () => {
    try {
      setLoading(true);
      const datos = await db.getAll('pedidos'); 
      const datosOrdenados = datos.sort((a, b) => {
        const numA = parseInt(a.numero_pedido) || 0;
        const numB = parseInt(b.numero_pedido) || 0;
        return numB - numA;
      });
      setListaPedidos(datosOrdenados);
      
      const pedidosActivos = datosOrdenados.filter(p => p.estatus === 'Activo' || !p.estatus).length;
      const pedidosCerrados = datosOrdenados.filter(p => p.estatus === 'Cerrado').length;
      
      setStats({ pedidosActivos, pedidosCerrados });
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
      alert("❌ Error al cargar los pedidos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarRegistros();
    
    const handleClickOutside = (event) => {
      const isDropdownClick = Object.values(dropdownRefs.current).some(
        ref => ref && ref.contains(event.target)
      );
      if (!isDropdownClick) {
        setDropdownAbierto(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ==================== MANEJO DROPDOWN ====================
  
  const toggleDropdown = (pedidoId, e) => {
    if (e) e.stopPropagation();
    setDropdownAbierto(dropdownAbierto === pedidoId ? null : pedidoId);
  };

  // ==================== FUNCIONES DE ACCIÓN ====================
  
  const handleNuevoPedido = () => {
    setPedidoSeleccionado(null);
    setModalOpen(true);
  };

  const handleSeleccionarPedido = (pedido) => {
    setPedidoSeleccionado(pedido);
    setModalOpen(true);
  };

  const handleEditar = (pedido, e) => {
    e.stopPropagation();
    setDropdownAbierto(null);
    
    if (pedido.estatus === 'Cerrado') {
      alert("ℹ️ Solo se pueden editar pedidos en estado Activo.");
      return;
    }
    
    console.log('Editando pedido:', pedido.id, pedido.numero_pedido);
    setPedidoSeleccionado(pedido);
    setModalOpen(true);
  };

  const handleRecibir = async (pedido, e) => {
    e.stopPropagation();
    setDropdownAbierto(null);
    
    if (pedido.estatus === 'Cerrado') {
      alert("ℹ️ Este pedido ya fue recibido.");
      return;
    }
    
    const confirmar = window.confirm(
      `¿Procesar ingreso del pedido #${pedido.numero_pedido}?\n\n` +
      `✅ Esto incrementará el stock y marcará como "Cerrado".`
    );
    
    if (!confirmar) return;
    
    try {
      if (pedido.items && Object.keys(pedido.items).length > 0) {
        for (const [prodId, qty] of Object.entries(pedido.items)) {
          const cantidadNum = parseInt(qty);
          if (cantidadNum > 0) {
            await db.updateStock(parseInt(prodId), cantidadNum);
          }
        }
      }

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

  const handleEliminar = async (pedido, e) => {
    e.stopPropagation();
    setDropdownAbierto(null);
    
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

  const exportarPedido = async (pedido, e) => {
    if (e) e.stopPropagation();
    setDropdownAbierto(null);
    
    try {
      const productos = await db.getAll('productos');
      const deliveryConfig = await db.get('config', 'delivery');
      const deliveryCost = deliveryConfig ? parseFloat(deliveryConfig.valor) : 0;
      
      const items = pedido.items || {};
      const listaProductos = [];
      let totalUnidades = 0;
      
      for (const [productoId, cantidad] of Object.entries(items)) {
        if (cantidad > 0) {
          const producto = productos.find(p => p.id == productoId);
          const nombre = producto?.nombre || `Producto ${productoId}`;
          listaProductos.push(`${cantidad} x ${nombre}`);
          totalUnidades += parseInt(cantidad);
        }
      }
      
      const subtotalUSD = pedido.total_usd || 0;
      const totalGeneralUSD = subtotalUSD + deliveryCost;
      
      const contenido = `
PEDIDO NATURA ICE
=====================

Numero: #${pedido.numero_pedido}
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
Subtotal USD: $${subtotalUSD.toFixed(2)}
Delivery: $${deliveryCost.toFixed(2)}
=====================
TOTAL GENERAL: $${totalGeneralUSD.toFixed(2)}
Total Bs: ${(totalGeneralUSD * pedido.tasa)?.toFixed(2) || '0.00'}

=====================
INFORMACION:
=====================

Contacto: Sra. Magali Hernandez (Corocito)

=====================
Generado: ${new Date().toLocaleDateString('es-ES')}
=====================
      `.trim();
      
      const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `Pedido_${pedido.numero_pedido}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
      alert(`✅ Pedido #${pedido.numero_pedido} exportado\n\nArchivo listo para enviar al proveedor.\n\nIncluye Delivery: $${deliveryCost.toFixed(2)}`);
      
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

  // ==================== COMPONENTE DROPDOWN ====================
  
  const DropdownAcciones = ({ pedido }) => {
    const isActive = pedido.estatus === 'Activo' || !pedido.estatus;
    const isOpen = dropdownAbierto === pedido.id;
    
    return (
      <div 
        ref={el => dropdownRefs.current[pedido.id] = el}
        className={styles.dropdownContainer}
      >
        <button 
          onClick={(e) => toggleDropdown(pedido.id, e)}
          className={styles.dropdownButton}
          title="Acciones"
        >
          ⋮
        </button>
        
        {isOpen && (
          <div className={styles.dropdownMenu}>
            <button
              onClick={(e) => handleEditar(pedido, e)}
              className={`${styles.dropdownItem} ${!isActive ? styles.disabled : ''}`}
              disabled={!isActive}
              title={isActive ? "Editar pedido" : "Solo para pedidos pendientes"}
            >
              <span className={styles.dropdownIcon}>✏️</span>
              <span>Editar</span>
            </button>
            
            <button
              onClick={(e) => handleRecibir(pedido, e)}
              className={`${styles.dropdownItem} ${!isActive ? styles.disabled : ''}`}
              disabled={!isActive}
              title={isActive ? "Marcar como recibido" : "Ya recibido"}
            >
              <span className={styles.dropdownIcon}>📥</span>
              <span>Recibir</span>
            </button>
            
            <button
              onClick={(e) => handleEliminar(pedido, e)}
              className={`${styles.dropdownItem} ${!isActive ? styles.disabled : ''}`}
              disabled={!isActive}
              title={isActive ? "Eliminar pedido" : "No se puede eliminar pedidos recibidos"}
            >
              <span className={styles.dropdownIcon}>🗑️</span>
              <span>Eliminar</span>
            </button>
            
            <button
              onClick={(e) => exportarPedido(pedido, e)}
              className={styles.dropdownItem}
              title="Exportar pedido para proveedor"
            >
              <span className={styles.dropdownIcon}>📤</span>
              <span>Exportar</span>
            </button>
            
            <div className={styles.dropdownSeparator}></div>
            
            <button
              onClick={() => handleSeleccionarPedido(pedido)}
              className={styles.dropdownItem}
              title="Ver detalles del pedido"
            >
              <span className={styles.dropdownIcon}>👁️</span>
              <span>Ver detalles</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  // ==================== RENDER ====================
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button 
          onClick={() => navigate(-1)} 
          className={styles.backArrow}
          title="Volver"
        >
          ←
        </button>
        <h1 className={styles.title}>📦 Gestión de Pedidos</h1>
      </div>

      <div className={styles.statsBar}>
        <div className={styles.statCard}>
          <div className={`${styles.statNumber} ${styles.statNumberTotal}`}>
            {listaPedidos.length}
          </div>
          <div className={styles.statLabel}>TOTAL PEDIDOS</div>
        </div>
        
        <div className={styles.statCard}>
          <div className={`${styles.statNumber} ${styles.statNumberActive}`}>
            {stats.pedidosActivos}
          </div>
          <div className={styles.statLabel}>PENDIENTES</div>
        </div>
        
        <div className={styles.statCard}>
          <div className={`${styles.statNumber} ${styles.statNumberClosed}`}>
            {stats.pedidosCerrados}
          </div>
          <div className={styles.statLabel}>RECIBIDOS</div>
        </div>
      </div>

      <div className={styles.content}>
        <button 
          className={styles.addBtnCircle}
          onClick={handleNuevoPedido}
          title="Crear nuevo pedido"
        >
          +
        </button>

        <div className={styles.headerRow}>
          <div className={styles.headerCell}>PEDIDO</div>
          <div className={styles.headerCell}>FECHA</div>
          <div className={styles.headerCell}>TOTAL</div>
          <div className={styles.headerCell}>ACCIONES</div>
        </div>

        <div className={styles.listaContainer}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <div>Cargando pedidos...</div>
            </div>
          ) : listaPedidos.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>📭</div>
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
                  className={`${styles.row} ${isHovered ? styles.rowHover : ''}`}
                  onMouseEnter={() => setHoveredRow(p.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  <div className={styles.cell}>
                    <div className={styles.pedidoNumero}>#{p.numero_pedido}</div>
                    <div className={`${styles.pedidoEstatus} ${
                      isActive ? styles.estatusActivo : styles.estatusCerrado
                    }`}>
                      {isActive ? '🟢 Pendiente' : '✅ Recibido'}
                    </div>
                  </div>
                  
                  <div className={styles.cell}>
                    {formatearFecha(p.fecha_pedido)}
                    <div style={{ fontSize: '11px', color: '#7f8c8d', marginTop: '2px' }}>
                      {itemsCount} producto{itemsCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                  
                  <div className={styles.cell}>
                    <div className={styles.totalContainer}>
                      <span className={styles.totalBS}>
                        Bs. {p.total_bs ? p.total_bs.toFixed(2) : "0.00"}
                      </span>
                      <span className={styles.totalUSD}>
                        $ {p.total_usd ? p.total_usd.toFixed(2) : "0.00"}
                      </span>
                    </div>
                  </div>
                  
                  <div className={styles.cell}>
                    <DropdownAcciones pedido={p} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

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
    </div>
  );
};

export default PedidosComponente;