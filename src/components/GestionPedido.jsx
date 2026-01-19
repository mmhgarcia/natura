import React, { useState, useEffect } from 'react';
import { db } from '../lib/db/database'; // Acceso a la base de datos dbTasaBCV [5]

const GestionPedido = ({ pedido, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    numero_pedido: '',
    fecha_pedido: new Date().toISOString().split('T'),
    tasa: '' // Se llenará desde la tabla config [2]
  });
  
  const [productos, setProductos] = useState([]);
  const [listaGrupos, setListaGrupos] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [cantidades, setCantidades] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // 1. Cargar la tasa BCV desde la tabla config [3, 4, 6]
        const tasaConfig = await db.getConfigValue('tasa');
        
        // 2. Cargar productos y grupos de la base de datos [7]
        const [todosLosProductos, todosLosGrupos] = await Promise.all([
          db.getAll('productos'),
          db.getAll('grupos')
        ]);

        setProductos(todosLosProductos);
        setListaGrupos(todosLosGrupos);

        // 3. Inicializar formulario
        if (pedido) {
          setFormData({
            numero_pedido: pedido.numero_pedido || '',
            fecha_pedido: pedido.fecha_pedido || '',
            tasa: pedido.tasa || (tasaConfig ? tasaConfig.toString() : '')
          });
        } else if (tasaConfig) {
          setFormData(prev => ({ ...prev, tasa: tasaConfig.toString() }));
        }
      } catch (err) {
        console.error("Error al cargar datos iniciales:", err);
      }
    };
    cargarDatos();
  }, [pedido]);

  const handleIncrement = (id) => {
    setCantidades(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const handleDecrement = (id) => {
    setCantidades(prev => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) - 1) }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const pedidoData = { ...formData, items: cantidades };
      if (pedido) {
        await db.put('pedidos', { id: pedido.id, ...pedidoData });
      } else {
        await db.add('pedidos', pedidoData);
      }
      onSave();
      onClose();
    } catch (err) {
      setError('Error al grabar el pedido: ' + err.message);
    }
  };

  const getPrecioGrupo = (nombreGrupo) => {
    const grupo = listaGrupos.find(g => g.nombre.toLowerCase() === nombreGrupo.toLowerCase());
    return grupo ? grupo.precio.toFixed(2) : "0.00";
  };

  const productosFiltrados = productos.filter(p => 
    p.nombre.toLowerCase().includes(filtro.toLowerCase())
  );

  const productosAgrupados = productosFiltrados.reduce((acc, prod) => {
    const grupo = prod.grupo || 'Otros';
    if (!acc[grupo]) acc[grupo] = [];
    acc[grupo].push(prod);
    return acc;
  }, {});

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>GESTION DE PEDIDOS</h2>
          <button onClick={onClose} style={styles.closeButton}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.content}>
          <div style={styles.topRow}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Pedido #</label>
              <input 
                type="text" 
                name="numero_pedido" 
                value={formData.numero_pedido} 
                onChange={handleChange} 
                style={styles.inputSmall} 
                required 
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Fecha</label>
              <input 
                type="date" 
                name="fecha_pedido" 
                value={formData.fecha_pedido} 
                onChange={handleChange} 
                style={styles.inputSmall} 
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Tasa (BCV)</label>
              <input 
                type="text" 
                name="tasa" 
                value={formData.tasa} 
                style={styles.inputReadOnly} 
                readOnly // Campo de solo lectura solicitado
              />
            </div>
          </div>

          <div style={styles.filterBar}>
            <input 
              type="text" 
              placeholder="Filtro de productos" 
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              style={styles.filterInput}
            />
            <div style={styles.filterIcon}>▼</div>
          </div>

          <div style={styles.productListContainer}>
            <div style={styles.productListHeader}>Lista de Productos</div>
            <div style={styles.productList}>
              {Object.entries(productosAgrupados).map(([grupo, items]) => (
                <div key={grupo}>
                  <div style={styles.groupTitle}>
                    {grupo.toUpperCase()} 
                    <span style={styles.groupPrice}> (${getPrecioGrupo(grupo)})</span>
                  </div>
                  {items.map((prod) => (
                    <div key={prod.id} style={styles.productItem}>
                      <div style={styles.productName}>
                        <strong>{prod.nombre}</strong> <small>(ID: {prod.id})</small>
                      </div>
                      <div style={styles.productDetails}>
                        <span style={styles.stockText}>Stock: {prod.stock}</span>
                        <div style={styles.quantityControl}>
                          <button type="button" onClick={() => handleDecrement(prod.id)} style={styles.qtyBtn}>-</button>
                          <input 
                            type="number" 
                            value={cantidades[prod.id] || 0}
                            onChange={(e) => setCantidades({...cantidades, [prod.id]: parseInt(e.target.value) || 0})}
                            style={styles.qtyInput}
                          />
                          <button type="button" onClick={() => handleIncrement(prod.id)} style={styles.qtyBtn}>+</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div style={styles.footer}>
            <button type="button" onClick={() => setCantidades({})} style={styles.blueBtn}>Vaciar</button>
            <button type="submit" style={styles.blueBtn}>Grabar</button>
          </div>
          {error && <div style={styles.error}>{error}</div>}
        </form>
      </div>
    </div>
  );
};

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 },
  modal: { backgroundColor: '#fff', width: '95%', maxWidth: '500px', maxHeight: '95vh', border: '1px solid #ccc', padding: '10px', borderRadius: '4px', display: 'flex', flexDirection: 'column' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #00BFFF', marginBottom: '10px' },
  title: { fontSize: '16px', fontWeight: 'bold', color: '#000', margin: 0 },
  closeButton: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#000' },
  content: { display: 'flex', flexDirection: 'column', gap: '10px' },
  topRow: { display: 'flex', gap: '8px', justifyContent: 'space-between' },
  inputGroup: { display: 'flex', flexDirection: 'column', flex: 1, gap: '4px' },
  label: { fontSize: '12px', fontWeight: 'bold', color: '#000' }, 
  inputSmall: { padding: '6px', border: '1px solid #aaa', fontSize: '13px', color: '#000', backgroundColor: '#fff', width: '100%', boxSizing: 'border-box' },
  // Estilo específico para el campo de solo lectura
  inputReadOnly: { padding: '6px', border: '1px solid #ccc', fontSize: '13px', color: '#555', backgroundColor: '#f0f0f0', width: '100%', boxSizing: 'border-box', cursor: 'not-allowed' },
  filterBar: { display: 'flex' },
  filterInput: { flex: 1, padding: '8px', border: '1px solid #aaa', color: '#000', backgroundColor: '#fff' },
  filterIcon: { padding: '8px', backgroundColor: '#e1f5fe', border: '1px solid #aaa', color: '#00BFFF' },
  productListContainer: { border: '1px solid #aaa', borderRadius: '2px' },
  productListHeader: { textAlign: 'center', color: '#00BFFF', padding: '5px', borderBottom: '1px solid #aaa', fontWeight: 'bold' },
  productList: { height: '275px', overflowY: 'auto', backgroundColor: '#fff' }, 
  groupTitle: { fontSize: '18px', fontWeight: 'bold', backgroundColor: '#f1f1f1', padding: '8px 10px', color: '#000', display: 'flex', justifyContent: 'space-between' },
  groupPrice: { color: '#007bff', fontSize: '16px' },
  productItem: { padding: '8px 10px', borderBottom: '1px solid #eee' },
  productName: { fontSize: '14px', color: '#000' }, 
  productDetails: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  stockText: { fontSize: '12px', color: '#333' },
  quantityControl: { display: 'flex', alignItems: 'center', gap: '4px' },
  qtyBtn: { 
    width: '30px', height: '30px', backgroundColor: '#eee', border: '1px solid #ccc', cursor: 'pointer', 
    fontWeight: 'bold', fontSize: '18px', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  qtyInput: { width: '40px', textAlign: 'center', border: '1px solid #ccc', padding: '4px', color: '#000', backgroundColor: '#fff' },
  footer: { display: 'flex', gap: '15px', marginTop: '5px' },
  blueBtn: { backgroundColor: '#7ecbff', color: 'white', border: 'none', padding: '10px 25px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' },
  error: { color: 'red', fontSize: '12px', textAlign: 'center' }
};

export default GestionPedido;