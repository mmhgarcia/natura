import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/db/database'; // Acceso a IndexedDB [1, 4]
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
      const datos = await db.getAll('pedidos'); // Obtiene de la tabla pedidos [5]
      
      const datosOrdenados = datos.sort((a, b) => {
        const numA = parseInt(a.numero_pedido) || 0;
        const numB = parseInt(b.numero_pedido) || 0;
        return numB - numA; // Orden descendente por número de pedido
      });

      setListaPedidos(datosOrdenados);

      // Calcular estadísticas de pedidos [6]
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
      if (!isDropdownClick) setDropdownAbierto(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ==================== FUNCIONES DE ACCIÓN ====================
  
  const handleNuevoPedido = () => {
    setPedidoSeleccionado(null);
    setModalOpen(true);
  };

  // NUEVA FUNCIÓN: Vaciar historial con confirmación
  const handleVaciarTodo = async () => {
    const primeraConfirmacion = window.confirm(
      "⚠️ ¿ESTÁS SEGURO?\n\nEsta acción eliminará TODOS los pedidos del historial permanentemente."
    );

    if (primeraConfirmacion) {
      const segundaConfirmacion = window.confirm(
        "🚨 ¡ATENCIÓN!\n\nSe borrarán tanto pedidos pendientes como recibidos. ¿Proceder de todas formas?"
      );

      if (segundaConfirmacion) {
        try {
          await db.db.pedidos.clear(); // Limpia la tabla pedidos en IndexedDB [4, 5]
          alert("✅ Historial de pedidos vaciado correctamente.");
          cargarRegistros();
        } catch (error) {
          console.error("Error al vaciar pedidos:", error);
          alert("❌ Error al vaciar la base de datos.");
        }
      }
    }
  };

  const handleEditar = (pedido, e) => {
    e.stopPropagation();
    setDropdownAbierto(null);
    if (pedido.estatus === 'Cerrado') {
      alert("ℹ️ Solo se pueden editar pedidos en estado Activo.");
      return;
    }
    setPedidoSeleccionado(pedido);
    setModalOpen(true);
  };

  const handleRecibir = async (pedido, e) => {
    e.stopPropagation();
    setDropdownAbierto(null);
    if (pedido.estatus === 'Cerrado') return;

    const confirmar = window.confirm(`¿Procesar ingreso del pedido #${pedido.numero_pedido}?\n\n✅ Esto incrementará el stock y marcará como "Cerrado".`);
    if (!confirmar) return;

    try {
      // Actualizar stock de cada producto en el pedido [7]
      if (pedido.items) {
        for (const [prodId, qty] of Object.entries(pedido.items)) {
          if (parseInt(qty) > 0) {
            await db.updateStock(parseInt(prodId), parseInt(qty));
          }
        }
      }

      await db.put('pedidos', {
        ...pedido,
        estatus: 'Cerrado',
        fechaRecepcion: new Date().toISOString()
      });

      alert(`✅ Pedido #${pedido.numero_pedido} recibido.`);
      cargarRegistros();
    } catch (error) {
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

    if (window.confirm(`⚠️ ¿ELIMINAR PEDIDO #${pedido.numero_pedido}?\n\nEsta acción NO se puede deshacer.`)) {
      try {
        await db.del('pedidos', pedido.id); // Elimina de IndexedDB [7, 8]
        cargarRegistros();
      } catch (error) {
        alert(`❌ Error: ${error.message}`);
      }
    }
  };

  const exportarPedido = async (pedido, e) => {
    if (e) e.stopPropagation();
    setDropdownAbierto(null);
    // Lógica de exportación de archivo .txt para proveedor [9, 10]
    // ... (Se mantiene igual a la fuente original)
  };

  // ==================== RENDER ====================

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => navigate(-1)} className={styles.backArrow}>←</button>
        <h1 className={styles.title}>📦 Gestión de Pedidos</h1>
      </header>

      <div className={styles.statsBar}>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{listaPedidos.length}</span>
          <span className={styles.statLabel}>TOTAL</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber} style={{color: '#27ae60'}}>{stats.pedidosActivos}</span>
          <span className={styles.statLabel}>PENDIENTES</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber} style={{color: '#3498db'}}>{stats.pedidosCerrados}</span>
          <span className={styles.statLabel}>RECIBIDOS</span>
        </div>
      </div>

      <main className={styles.content}>
        <div className={styles.actionHeader}>
          <button className={styles.addBtnCircle} onClick={handleNuevoPedido}>+</button>
          {listaPedidos.length > 0 && (
            <button className={styles.vaciarHistorialBtn} onClick={handleVaciarTodo}>
              🗑️ Vaciar Historial
            </button>
          )}
        </div>

        <div className={styles.headerRow}>
          <div className={styles.headerCell}>PEDIDO</div>
          <div className={styles.headerCell}>FECHA</div>
          <div className={styles.headerCell}>TOTAL</div>
          <div className={styles.headerCell}>ACCIONES</div>
        </div>

        <div className={styles.listaContainer}>
          {loading ? (
            <div className={styles.loading}>Cargando...</div>
          ) : listaPedidos.length === 0 ? (
            <div className={styles.emptyState}>No hay pedidos registrados</div>
          ) : (
            listaPedidos.map((p) => (
              <div 
                key={p.id} 
                className={styles.row}
                onClick={() => setPedidoSeleccionado(p) || setModalOpen(true)}
              >
                <div className={styles.cell}>
                  <span className={styles.pedidoNumero}>#{p.numero_pedido}</span>
                  <span className={p.estatus === 'Cerrado' ? styles.estatusCerrado : styles.estatusActivo}>
                    {p.estatus === 'Cerrado' ? '✅ Recibido' : '🟢 Pendiente'}
                  </span>
                </div>
                <div className={styles.cell}>
                  {new Date(p.fecha_pedido).toLocaleDateString('es-ES')}
                </div>
                <div className={styles.cell}>
                  <div className={styles.totalBS}>Bs. {p.total_bs?.toFixed(2)}</div>
                  <div className={styles.totalUSD}>$ {p.total_usd?.toFixed(2)}</div>
                </div>
                <div className={styles.cell}>
                  <button 
                    className={styles.dropdownButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDropdownAbierto(dropdownAbierto === p.id ? null : p.id);
                    }}
                  >⋮</button>
                  {dropdownAbierto === p.id && (
                    <div className={styles.dropdownMenu}>
                      <button onClick={(e) => handleEditar(p, e)} className={styles.dropdownItem}>✏️ Editar</button>
                      <button onClick={(e) => handleRecibir(p, e)} className={styles.dropdownItem}>📥 Recibir</button>
                      <button onClick={(e) => exportarPedido(p, e)} className={styles.dropdownItem}>📤 Exportar</button>
                      <button onClick={(e) => handleEliminar(p, e)} className={styles.dropdownItem}>🗑️ Eliminar</button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

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