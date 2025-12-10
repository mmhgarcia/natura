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

  const [seleccionados, setSeleccionados] = useState([]);

  const [tasa, setTasa] = useState(0);

  useEffect(() => {
    if (productos.length === 0) setProductos(data.productos);
    if (ogrupos.length === 0) setGrupos(ogrupos);

    const tasaLS = localStorage.getItem("tasa");
    if (tasaLS) setTasa(parseFloat(tasaLS));
  }, []);

  // Maneja clicks en el título para abrir modal admin
  const handleTitleClick = () => {
    setClickCount((prev) => prev + 1);
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

  // Añadir producto seleccionado
  const addSeleccionado = (p) => {
    setSeleccionados([...seleccionados, p]);
  };

  // Eliminar item de la lista
  const removeSeleccionado = (index) => {
    setSeleccionados(seleccionados.filter((_, i) => i !== index));
  };

  // Vaciar lista
  const vaciarSeleccionados = () => setSeleccionados([]);

  // Calcular total
  const totalBs = (seleccionados.length * tasa).toFixed(2);

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
              className={styles.adminInput}
            />
            <button onClick={handleAdminLogin} className={styles.adminBtn}>
              Entrar
            </button>
            <button
              onClick={() => setShowAdminModal(false)}
              className={styles.adminCloseBtn}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Botón salir admin */}
      {adminMode && (
        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <button onClick={handleAdminLogout} className={styles.adminBtn}>
            Salir de Admin
          </button>
        </div>
      )}

      {/* Grid productos */}
      <div className={styles.grid}>
        {productos
          .filter((p) => p.stock > 0)
          .map((p) => (
            <div
              key={p.id}
              className={styles.card}
              onClick={() => addSeleccionado(p)}
            >
              <img src={p.imagen} alt={p.nombre} className={styles.image} />
              <p>{p.nombre}</p>
              <p>Und: {p.stock}</p>
              <p># {p.id}</p>
            </div>
          ))}
      </div>

      {/* Contenedor seleccionados */}
      <div className={styles.seleccionadosContainer}>
        <div className={styles.seleccionadosHeader}>
          SELECCIONADOS ({seleccionados.length})
        </div>
        <ul className={styles.seleccionadosList}>
          {seleccionados.map((item, index) => (
            <li key={index} className={styles.selectedItem}>
              <span>
                {item.id} - {item.nombre}
              </span>
              <button
                className={styles.removeBtn}
                onClick={() => removeSeleccionado(index)}
              >
                Eliminar
              </button>
            </li>
          ))}
          <li className={styles.selectedTotal}>TOTAL BS: {totalBs}</li>
        </ul>
        <button className={styles.vaciarBtn} onClick={vaciarSeleccionados}>
          Vaciar
        </button>
      </div>
    </div>
  );
}
