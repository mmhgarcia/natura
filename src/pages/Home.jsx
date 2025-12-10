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

  useEffect(() => {
    if (productos.length === 0) {
      setProductos(data.productos);
    }

    if (ogrupos.length === 0) {
      setGrupos(ogrupos);
    }
  }, []);

  // Maneja clicks en el título para abrir modal
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

  // Agrega producto a lista de seleccionados (permitir duplicados)
  const agregarSeleccionado = (item) => {
    setSeleccionados(prev => [...prev, item]);
  };

  // Elimina producto de la lista de seleccionados
  const eliminarSeleccionado = (index) => {
    setSeleccionados(prev => prev.filter((_, i) => i !== index));
  };

  // Vaciar lista de seleccionados
  const vaciarSeleccionados = () => setSeleccionados([]);

  // Calcular total según grupo y tasa
  const calcularTotal = () => {
    const tasa = parseFloat(localStorage.getItem("tasa")) || 1;
    if (seleccionados.length === 0) return "0.00";

    let suma = 0;
    seleccionados.forEach(item => {
      if (!item.grupo) return;
      const costoUnitario = grupos?.grupos?.[0]?.[item.grupo] || 0;
      suma += costoUnitario;
    });

    return (suma * tasa).toFixed(2);
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
          .filter(p => p.stock > 0)
          .map(p => (
            <div
              key={p.id}
              className={styles.card}
              onClick={() => agregarSeleccionado(p)}
            >
              <img src={p.imagen} alt={p.nombre} className={styles.image} />
              <p>Und: {p.stock}</p>
              <p># {p.id}</p>
            </div>
          ))}
      </div>

      {/* Lista seleccionados (fijo abajo) */}
      <div className={styles.selectedContainer}>
        <div className={styles.selectedHeader}>
          🎯 SELECCIONADOS ({seleccionados.length})
        </div>
        <ul className={styles.selectedList}>
          {seleccionados.map((item, index) => (
            <li key={index} className={styles.selectedItem}>
              <p>{item.id} - {item.nombre}</p>
              <button onClick={() => eliminarSeleccionado(index)}>Eliminar</button>
            </li>
          ))}
          {seleccionados.length > 0 && (
            <li className={styles.selectedItem}>
              <p><strong>TOTAL BS: {calcularTotal()}</strong></p>
            </li>
          )}
        </ul>
        {seleccionados.length > 0 && (
          <div style={{ textAlign: "center", marginTop: "8px" }}>
            <button onClick={vaciarSeleccionados}>Vaciar</button>
          </div>
        )}
      </div>
    </div>
  );
}
