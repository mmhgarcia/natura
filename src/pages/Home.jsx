import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { db } from '../lib/db/database.js'; // Acceso a dbTasaBCV [4]
import { getTasaBCV } from '../lib/db/utils/tasaUtil.js'; // Utilidad de tasa [4]
import styles from './Home.module.css';

function Home() {
  const [productos, setProductos] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [listaDeSeleccionados, setListaDeSeleccionados] = useState([]);
  const [tasa, setTasa] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [filtroGrupo, setFiltroGrupo] = useState('todos');
  const navigate = useNavigate();

  // Carga inicial de datos desde IndexedDB [5]
  useEffect(() => {
    const cargarTodo = async () => {
      try {
        await db.init(); // Inicializa dbTasaBCV [5]
        const [p, g, t] = await Promise.all([
          db.getAll('productos'),
          db.getAll('grupos'),
          getTasaBCV()
        ]);
        setProductos(p);
        setGrupos(g);
        setTasa(t || 0);
      } catch (err) {
        console.error("Error initializing Home:", err);
      } finally {
        setCargando(false);
      }
    };
    cargarTodo();
  }, []);

  /**
   * FILTRADO ACTUALIZADO (Sin campo 'visible'):
   * Se elimina cualquier validación referente a la visibilidad.
   * Ahora sólo filtra por el grupo seleccionado [1].
   */
  const productosFiltrados = productos.filter(p => {
    return filtroGrupo === 'todos' || p.grupo === filtroGrupo;
  });

  // Confirmación para vaciar la lista [1]
  const handleVaciarLista = () => {
    if (listaDeSeleccionados.length === 0) return;
    const confirmar = window.confirm(
      `⚠️ ¿Estás seguro de que deseas vaciar la lista?\n\nSe eliminarán los ${listaDeSeleccionados.length} helados seleccionados.`
    );
    if (confirmar) setListaDeSeleccionados([]);
  };

  // Procesamiento de venta y actualización de stock [6, 7]
  const handleGrabar = async () => {
    if (listaDeSeleccionados.length === 0) return;
    const confirmar = window.confirm(`¿Desea procesar la venta de ${listaDeSeleccionados.length} helados?`);
    if (!confirmar) return;

    try {
      for (const item of listaDeSeleccionados) {
        const grupoInfo = grupos.find(g => g.nombre === item.grupo);
        const precioUsd = grupoInfo ? grupoInfo.precio : 0;

        // Registrar venta en IndexedDB [7]
        await db.add('ventas', {
          productoId: item.id,
          nombre: item.nombre,
          grupo: item.grupo,
          precioUsd: precioUsd,
          cantidad: 1,
          fecha: new Date().toISOString()
        });

        // Descontar inventario [7, 8]
        await db.updateStock(item.id, -1);
      }

      // Refrescar lista de productos con stock actualizado [7]
      const productosActualizados = await db.getAll('productos');
      setProductos(productosActualizados);
      setListaDeSeleccionados([]);
      alert("✅ Venta procesada con éxito.");
    } catch (error) {
      alert("❌ Error al procesar la venta.");
    }
  };

  const seleccionarProducto = (producto) => {
    setListaDeSeleccionados(prev => [...prev, producto]);
  };

  const eliminarItem = (indexParaEliminar) => {
    setListaDeSeleccionados(prev => prev.filter((_, index) => index !== indexParaEliminar));
  };

  const calcularTotales = () => {
    let usd = 0;
    listaDeSeleccionados.forEach(item => {
      const grupoInfo = grupos.find(g => g.nombre === item.grupo);
      usd += grupoInfo ? grupoInfo.precio : 0;
    });
    return { usd, bs: usd * tasa };
  };

  const { usd, bs } = calcularTotales();

  if (cargando) return <div className={styles.loading}>Cargando tienda...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.filterBar}>
        <label htmlFor="filtro-home">Filtrar por Grupo:</label>
        <select
          id="filtro-home"
          value={filtroGrupo}
          onChange={(e) => setFiltroGrupo(e.target.value)}
          className={styles.select}
        >
          <option value="todos">Todos los helados</option>
          {grupos.map(g => (
            <option key={g.id} value={g.nombre}>{g.nombre}</option>
          ))}
        </select>
      </div>

      <div className={styles.grid}>
        {productosFiltrados.map(p => {
          const grupoInfo = grupos.find(g => g.nombre === p.grupo);
          const precio = grupoInfo ? grupoInfo.precio : 0;
          const esAgotado = p.stock === 0;
          const esBajoStock = p.stock > 0 && p.stock <= 5;

          return (
            <div
              key={p.id}
              className={`${styles.card} ${esAgotado ? styles.cardDisabled : ''}`}
              onClick={() => !esAgotado && seleccionarProducto(p)}
            >
              <div
                className={styles.stockBadge}
                style={{ backgroundColor: esAgotado ? '#ff4d4d' : (esBajoStock ? '#ffa500' : '#28a745') }}
              >
                {p.stock}
              </div>
              
              {/* Renderizado de imagen corregido para mostrar el archivo real [2] */}
              {p.imagen ? (
                <img 
                  src={p.imagen} 
                  alt={p.nombre} 
                  className={styles.productImage} 
                  onError={(e) => { e.target.style.display = 'none'; }} 
                />
              ) : (
                <div className={styles.productImagePlaceholder}>{p.nombre}</div>
              )}

              <h3 className={styles.productTitle}>{p.nombre}</h3>
              <p className={styles.priceText}>
                ID: {p.id} - $: {precio.toFixed(2)} - Bs.: {(precio * tasa).toFixed(2)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Panel inferior fijo [9] */}
      <div className={styles.selectedContainer}>
        <div className={styles.selectedHeader}>
          <span>Items: <strong>{listaDeSeleccionados.length}</strong></span>
          <span>Tasa: <strong>{tasa.toFixed(2)}</strong></span>
        </div>

        <div className={styles.selectedList}>
          {listaDeSeleccionados.map((item, index) => (
            <div key={`${item.id}-${index}`} className={styles.selectedItem}>
              <span>#{item.id} - {item.nombre}</span>
              <button 
                className={styles.eliminarBtn} 
                onClick={(e) => { e.stopPropagation(); eliminarItem(index); }}
              >
                ELIM
              </button>
            </div>
          ))}
        </div>

        <div className={styles.totalRow}>
          Total: ${usd.toFixed(2)} | Bs. {bs.toFixed(2)}
        </div>

        <div className={styles.actionButtons}>
          <button className={styles.vaciarBtn} onClick={handleVaciarLista}>
            Vaciar
          </button>
          <button
            className={styles.grabarBtn}
            onClick={handleGrabar}
            disabled={listaDeSeleccionados.length === 0}
          >
            Grabar
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;