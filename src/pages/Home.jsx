import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useTasaBCV } from "../lib/db/hooks/useTasaBCV";

import data from "../data/data.json";
import ogrupos from "../data/grupos.json";

import styles from "./Home.module.css";

export default function Home() {
  const navigate = useNavigate();
  const [productos, setProductos] = useLocalStorage("productos", []);
  const [grupos, setGrupos] = useLocalStorage("grupos", []);
  const [adminMode, setAdminMode] = useLocalStorage("adminMode", false);
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const { tasa, repository } = useTasaBCV();
  
  // Lista de productos seleccionados
  const [seleccionados, setSeleccionados] = useState([]);

  // -------------------------------
  // INIT
  // -------------------------------
  useEffect(() => {
    if (productos.length === 0) setProductos(data.productos);
    if (ogrupos.length === 0) setGrupos(ogrupos);

    try {
      const result = repository.convertirABs(10);
      alert(result);
      alert(tasa);
    } catch (error) {
      console.error("Error:", error);
      alert("Error occurred: " + error.message);
    }

  }, []);


  // -------------------------------
  // ADMIN SECRET CLICK
  // -------------------------------
  const handleTitleClick = () => {
    setClickCount(prev => prev + 1);
    setTimeout(() => setClickCount(0), 500);

    if (clickCount + 1 === 3) {
      setShowAdminModal(true);
      setClickCount(0);
    }
  };

  const handleAdminLogin = () => {
    if (adminPassword === "1234") {
      setAdminMode(true);
      setShowAdminModal(false);
      navigate("/panel");
    } else {
      alert("Clave incorrecta");
    }
  };

  const handleAdminLogout = () => {
    setAdminMode(false);
    setAdminPassword("");
  };

  // -------------------------------
  // SELECT PRODUCTO
  // -------------------------------
  const handleSelectProducto = (p) => {
    setSeleccionados(prev => [...prev, p]);
  };

  const handleEliminar = (index) => {
    setSeleccionados(prev => prev.filter((_, i) => i !== index));
  };

  const handleVaciar = () => {
    setSeleccionados([]);
  };

  // -------------------------------
  // TOTAL
  // -------------------------------
  const total = () => {
    if (!seleccionados.length) {
      return { totaldolar: 0, totalbs: 0 };
    }

    const gruposObj = grupos[0] || {};
    let suma = 0;

    seleccionados.forEach(item => {
      const grupoName = (item.grupo || "").toLowerCase();
      const costoUnit = gruposObj[grupoName] ?? 0;
      suma += costoUnit;
    });

    return {
      totaldolar: suma,
      totalbs: suma * (tasa || 1)
    };
  };

  const { totaldolar, totalbs } = total();

  // -------------------------------
  // RENDER
  // -------------------------------
  return (
    <div className={styles.container}>
      <h2 className={styles.title} onClick={handleTitleClick}>
        Natura Ice
      </h2>

      {/* Modal Admin */}
      {showAdminModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Login Admin</h3>

            <input
              type="password"
              placeholder="Clave Admin"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
            />

            <button onClick={handleAdminLogin}>Entrar</button>
            <button onClick={() => setShowAdminModal(false)}>Cerrar</button>
          </div>
        </div>
      )}

      {/* Botón salir admin */}
      {adminMode && (
        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <button onClick={handleAdminLogout}>Salir de Admin</button>
        </div>
      )}

      {/* Grid de productos */}
      <div className={styles.grid}>
        {productos
          .filter((p) => p.stock > 0)
          .map((p) => (
            <div
              key={p.id}
              className={styles.card}
              onClick={() => handleSelectProducto(p)}
            >
              <img src={p.imagen} alt={p.nombre} className={styles.image} />
              <p>Und: {p.stock}</p>
              <p># {p.id}</p>
            </div>
          ))}
      </div>

      {/* Lista de seleccionados */}
      <div className={styles.selectedContainer}>
        <div className={styles.selectedHeader}>
          🎯 SELECCIONADOS ({seleccionados.length})
        </div>

        <div className={styles.selectedList}>
          {seleccionados.map((item, index) => (
            <div key={index} className={styles.selectedItem}>
              <p>{item.id} - {item.nombre}</p>
              <button onClick={() => handleEliminar(index)}>
                Eliminar
              </button>
            </div>
          ))}

          <div className={styles.selectedItem}>
            <p>
              TOTAL $: {totaldolar.toFixed(2)}  
              &nbsp;&nbsp;|&nbsp;&nbsp;  
              TOTAL Bs: {totalbs.toFixed(2)}
            </p>
          </div>
        </div>

        <button className={styles.vaciarBtn} onClick={handleVaciar}>
          Vaciar
        </button>
      </div>
    </div>
  );
}
