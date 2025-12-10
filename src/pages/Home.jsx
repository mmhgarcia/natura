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

  const [selected, setSelected] = useState([]); // ⬅️ Lista dinámica de seleccionados

  useEffect(() => {
    if (productos.length === 0) {
      setProductos(data.productos);
    }

    if (ogrupos.length === 0) {
      setGrupos(ogrupos);
    }
  }, []);

  // Triple click en el título
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

  // ⬅️ Al hacer click en una card, agregar a seleccionados (con duplicados)
  const handleSelectProduct = (p) => {
    setSelected([...selected, p]);
  };

  const handleRemoveSelected = (index) => {
    const updated = selected.filter((_, i) => i !== index);
    setSelected(updated);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title} onClick={handleTitleClick}>
        Natura Ice
      </h2>

      {/* Modal Admin */}
      {showAdminModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <h3>Login Admin</h3>

            <input
              type="password"
              placeholder="Clave Admin"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className={styles.modalInput}
            />

            <button onClick={handleAdminLogin} className={styles.modalBtn}>
              Entrar
            </button>

            <button
              onClick={() => setShowAdminModal(false)}
              className={styles.modalClose}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Botón salir admin */}
      {adminMode && (
        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <button onClick={handleAdminLogout} className={styles.modalBtn}>
            Salir de Admin
          </button>
        </div>
      )}

      {/* GRID */}
      <div className={styles.grid}>
        {productos
          .filter((p) => p.stock > 0)
          .map((p) => (
            <div
              key={p.id}
              className={styles.card}
              onClick={() => handleSelectProduct(p)}
            >
              <img src={p.imagen} alt={p.nombre} className={styles.image} />
              <p>Und: {p.stock}</p>
              <p># {p.id}</p>
            </div>
          ))}
      </div>

      {/* CONTENEDOR SELECCIONADOS */}
      <div className={styles.selectedBox}>
        <h4 className={styles.selectedTitle}>
          🎯 SELECCIONADOS ({selected.length})
        </h4>

        <div className={styles.selectedList}>
          {selected.map((p, index) => (
            <div key={index} className={styles.selectedItem}>
              <span>
                #{p.id} — {p.nombre}
              </span>

              <button
                className={styles.removeBtn}
                onClick={() => handleRemoveSelected(index)}
              >
                X
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
