import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { db } from '../lib/db/database.js'; // Acceso a dbTasaBCV [3]
import { getTasaBCV } from '../lib/db/utils/tasaUtil.js'; // Utilidad de tasa [3]
import styles from './Home.module.css';

function Home() {
  const [productos, setProductos] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [listaDeSeleccionados, setListaDeSeleccionados] = useState([]);
  const [tasa, setTasa] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [filtroGrupo, setFiltroGrupo] = useState('todos');
  const navigate = useNavigate();

  // Función helper para enriquecer productos con info del grupo
  // Optimización: Usamos un Map para reducir la complejidad de O(N*M) a O(N) [BI/Performance]
  const enriquecerProductos = (listaProductos, listaGrupos) => {
    const gruposMap = new Map(listaGrupos.map(g => [g.nombre, g]));
    return listaProductos.map(p => {
      const grupoInfo = gruposMap.get(p.grupo);
      return {
        ...p,
        precio: grupoInfo ? grupoInfo.precio : 0,
        costo: grupoInfo ? (grupoInfo.costo_$ || 0) : 0
      };
    });
  };

  // Carga inicial de datos desde IndexedDB [4]
  useEffect(() => {
    const cargarTodo = async () => {
      try {
        await db.init(); // Inicializa dbTasaBCV [4]
        const [p, g, t] = await Promise.all([
          db.getAll('productos'),
          db.getAll('grupos'),
          getTasaBCV()
        ]);

        // Guardamos grupos raw por si se necesitan
        setGrupos(g);

        // Enriquecemos productos inmediatamente
        const productosEnriquecidos = enriquecerProductos(p, g);
        setProductos(productosEnriquecidos);

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
   * FILTRADO ACTUALIZADO Y SEGURO:
   * 1. Filtra por grupo seleccionado.
   * 2. Valida visibilidad: Si el campo 'visible' es estrictamente 'false', se oculta.
   *    Si es 'true' o 'undefined' (registros antiguos), se muestra [2, 5].
   */
  const productosFiltrados = productos.filter(p => {
    const coincideGrupo = filtroGrupo === 'todos' || p.grupo === filtroGrupo;
    const esVisible = p.visible !== false;
    return coincideGrupo && esVisible;
  });

  // Confirmación para vaciar la lista [6]
  const handleVaciarLista = () => {
    if (listaDeSeleccionados.length === 0) return;
    const confirmar = window.confirm(
      `⚠️ ¿Estás seguro de que deseas vaciar la lista?\n\nSe eliminarán los ${listaDeSeleccionados.length} helados seleccionados.`
    );
    if (confirmar) setListaDeSeleccionados([]);
  };

  const handleGrabar = async () => {
    if (listaDeSeleccionados.length === 0) return;

    const confirmar = window.confirm(`¿Desea procesar la venta de ${listaDeSeleccionados.length} helados?`);
    if (!confirmar) return;

    try {
      // 1. Validar Stock ANTES de iniciar la transacción [Producción/Robustez]
      // Agrupamos por producto para validar la suma de lo seleccionado
      const conteoPorProducto = listaDeSeleccionados.reduce((acc, p) => {
        acc[p.id] = (acc[p.id] || 0) + 1;
        return acc;
      }, {});

      for (const [id, cantidad] of Object.entries(conteoPorProducto)) {
        const pOriginal = productos.find(p => p.id === id);
        if (!pOriginal || pOriginal.stock < cantidad) {
          alert(`❌ Stock insuficiente para: ${pOriginal?.nombre || id}. Disponible: ${pOriginal?.stock || 0}`);
          return;
        }
      }

      // 2. Generar un ID de transacción único para análisis de BI
      const transaccionId = `TX-${Date.now()}`;

      // 3. Procesar venta ATÓMICA [Producción/Integridad]
      // Usamos la tabla 'ventas' y 'productos' en la transacción
      await db.transaction('rw', [db.ventas, db.productos], async () => {
        for (const item of listaDeSeleccionados) {
          const precioUsd = item.precio || 0;
          const costoUnitarioUsd = item.costo || 0;
          const utilidadUsd = precioUsd - costoUnitarioUsd;

          // Snapshot Financiero
          await db.add('ventas', {
            productoId: item.id,
            nombre: item.nombre,
            grupo: item.grupo,
            precioUsd: precioUsd,
            costoUnitarioUsd: costoUnitarioUsd,
            utilidadUsd: utilidadUsd,
            tasaVenta: tasa,
            transaccionId: transaccionId,
            cantidad: 1,
            fecha: new Date().toISOString()
          });

          // Actualizar stock
          await db.updateStock(item.id, -1);
        }
      });

      // Refrescar estado local
      const productosActualizados = await db.getAll('productos');
      const productosEnriquecidos = enriquecerProductos(productosActualizados, grupos);
      setProductos(productosEnriquecidos);

      setListaDeSeleccionados([]);
      alert("✅ Venta procesada con éxito con snapshot financiero y transaccionalidad.");

    } catch (error) {
      console.error("Error en snapshot de venta:", error);
      alert("❌ Error al procesar la venta. Los cambios no se aplicaron.");
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
      usd += item.precio || 0;
    });
    return { usd, bs: usd * tasa };
  };

  const { usd, bs } = calcularTotales();

  if (cargando) return <div className={styles.loading}>Cargando tienda...</div>;

  return (
    <div className={styles.container}>
      {/* Selector de Grupos */}
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

      {/* Grid de Productos [9] */}
      <div className={styles.grid}>
        {productosFiltrados.map(p => {
          const precio = p.precio || 0;
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

              {p.imagen ? (
                <img
                  src={p.imagen}
                  alt={p.nombre}
                  className={styles.productImage}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className={styles.imagePlaceholder}>📷 {p.nombre}</div>
              )}

              <h3 className={styles.productTitle}>{p.nombre}</h3>
              <p className={styles.priceText}>
                ID: {p.id} - $: {precio.toFixed(2)} - Bs.: {(precio * tasa).toFixed(2)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Panel inferior fijo [10, 11] */}
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