import { useEffect, useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useNavigate } from "react-router-dom";

import data from "../data/data.json";
import ogrupos from "../data/grupos.json";

import styles from "./Home.module.css";

export default function Home() {
  const navigate = useNavigate();
  const [productos, setProductos] = useLocalStorage("productos", []);
  const [grupos, setGrupos] = useLocalStorage("grupos", ogrupos);
  const [adminMode, setAdminMode] = useLocalStorage("adminMode", false);
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  // Lista de productos seleccionados
  const [seleccionados, setSeleccionados] = useState([]);

  // Tasa BCV
  const [tasa, setTasa] = useState(0);

  useEffect(() => {
    if (productos.length === 0) setProductos(data.productos);
    if (ogrupos.length === 0) setGrupos(ogrupos);

    const tasaLS = localStorage.getItem("tasa");
    if (tasaLS) setTasa(parseFloat(tasaLS));
  }, []);

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

  const handleSelectProducto = (p) => {
    setSeleccionados(prev => [...prev, p]);
  };

  const handleEliminar = (index) => {
    setSeleccionados(prev => prev.filter((_, i) => i !== index));
  };

  const handleVaciar = () => {
    setSeleccionados([]);
  };

  // Cálculo del total según grupos y tasa
  const total = () => {
    if (seleccionados.length === 0) return 0;
    let suma = 0;
    const gruposObj = grupos[0]; // primer objeto
    for (let i = 0; i < seleccionados.length; i++) {
      const item = seleccionados[i];
      const grupo = item.grupo;
      const costoUnit = gruposObj[grupo] ?? 0;
      suma += costoUnit;
    }
    return suma * tasa;
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title} onClick={handleTitleClick}>
        Natura Ice
      </h2>

      {/* Modal Admin */}
      {showAdminModal && (
        <div
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: "20px",
              borderRadius: "12px",
              textAlign: "center",
              minWidth: "300px"
            }}
          >
            <h3>Login Admin</h3>
            <input
              type="password"
              placeholder="Clave Admin"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              style={{ padding: "6px 10px", fontSize: "1rem", marginRight: "8px" }}
            />
            <button onClick={handleAdminLogin} style={{ padding: "6px 12px" }}>
              Entrar
            </button>
            <div style={{ marginTop: "12px" }}>
              <button onClick={() => setShowAdminModal(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Botón de salir de admin */}
      {adminMode && (
        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <button onClick={handleAdminLogout} style={{ padding: "6px 12px" }}>
            Salir de Admin
          </button>
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

      {/* Contenedor de seleccionados */}
      <div className={styles.seleccionadosContainer}>
        <div className={styles.seleccionadosHeader}>
          SELECCIONADOS ({seleccionados.length})
        </div>
        <div className={styles.seleccionadosList}>
          {seleccionados.map((item, index) => (
            <div key={index} className={styles.selectedItem}>
              <p>{item.id} - {item.nombre}</p>
              <button onClick={() => handleEliminar(index)}>Eliminar</button>
            </div>
          ))}
          {/* Total */}
          <div className={styles.selectedItem}>
            <p>TOTAL $: {total().toFixed(2)} / TOTAL BS: {(total() * tasa).toFixed(2)}</p>
          </div>
        </div>
        <button className={styles.vaciarBtn} onClick={handleVaciar}>
          Vaciar
        </button>
      </div>
    </div>
  );
}
