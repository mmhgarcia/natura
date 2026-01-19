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

  const cargarRegistros = async () => {
    try {
      setLoading(true);
      const datos = await db.getAll('pedidos'); // Fuente [4, 5]
      setListaPedidos(datos);
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarRegistros();
  }, []);

  const handleNuevoPedido = () => {
    setPedidoSeleccionado(null);
    setModalOpen(true); // Fuente [6, 7]
  };

  const handleSeleccionarPedido = (pedido) => {
    // Solo permite editar Pedidos Activos [7, 8]
    if (pedido.estado === 'Activo' || !pedido.estado) {
      setPedidoSeleccionado(pedido);
      setModalOpen(true);
    } else {
      alert("Solo se permite editar pedidos en estado Activo.");
    }
  };

  const styles = {
    // Ajuste para ocupar el 100% real y evitar la franja gris de fondo [3, 9]
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
    // Header con alineación a la izquierda [3, 10]
    header: {
      display: 'flex',
      alignItems: 'center',
      padding: '15px',
      backgroundColor: '#00BFFF', 
      color: 'white',
      width: '100%',
      boxSizing: 'border-box'
    },
    backArrow: {
      background: 'none',
      border: 'none',
      color: 'white',
      fontSize: '24px',
      cursor: 'pointer',
      marginRight: '10px',
      padding: 0 // Elimina padding heredado para alineación precisa
    },
    title: {
      fontSize: '20px',
      fontWeight: 'bold',
      margin: 0
    },
    content: {
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      boxSizing: 'border-box'
    },
    // CORRECCIÓN: Se añade 'padding: 0' para que sea un círculo perfecto y no una elipse [1, 6]
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
      boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
      padding: 0, // Fundamental para evitar la forma de elipse
      lineHeight: 0
    },
    listaContainer: {
      width: '100%'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    row: {
      borderBottom: '1px solid #eee',
      cursor: 'pointer'
    },
    cell: {
      padding: '15px 5px',
      textAlign: 'left',
      color: '#000'
    }
  };

  return (
    <div style={styles.container}>
      {/* Header: Flecha y Título alineados a la izquierda [3] */}
      <header style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backArrow}>←</button>
        <h1 style={styles.title}>Pedidos</h1>
      </header>

      <div style={styles.content}>
        {/* Botón circular verde con signo + blanco [6] */}
        <button 
          style={styles.addBtnCircle} 
          onClick={handleNuevoPedido}
        >
          +
        </button>

        <div style={styles.listaContainer}>
          {loading ? (
            <p>Cargando registros...</p>
          ) : (
            <table style={styles.table}>
              <tbody>
                {listaPedidos.length === 0 ? (
                  <tr>
                    <td style={styles.cell}>No hay pedidos registrados en dbTasaBCV.</td>
                  </tr>
                ) : (
                  listaPedidos.map((p) => (
                    <tr 
                      key={p.id} 
                      style={styles.row} 
                      onClick={() => handleSeleccionarPedido(p)}
                    >
                      <td style={styles.cell}>
                        <strong>{p.numero_pedido}</strong><br/>
                        <small>{new Date(p.fecha_pedido).toLocaleDateString()}</small>
                      </td>
                      <td style={{...styles.cell, textAlign: 'right'}}>
                        Bs. {p.tasa}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal de Gestión [6, 11] */}
      {modalOpen && (
        <GestionPedido 
          pedido={pedidoSeleccionado}
          onClose={() => setModalOpen(false)}
          onSave={cargarRegistros}
        />
      )}
    </div>
  );
};

export default PedidosComponente;