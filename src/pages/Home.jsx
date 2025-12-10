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
  const [selectedItems, setSelectedItems] = useState([]);

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
    if (adminPassword === "1234") { // clave correcta
      setAdminMode(true);
      setShowAdminModal(false);
      navigate("/panel"); // redirige automáticamente
    } else {
      alert("Clave incorrecta");
    }
  };

  const handleAdminLogout = () => {
    setAdminMode(false);
    setAdminPassword("");
  };

  const handleSelectProduct = (producto) => {
    setSelectedItems(prev => [...prev, producto]); // permite duplicados
  };

  const handleRemoveSelected = (index) => {
    setSelectedItems(prev => prev.filter((_, i) => i !== index));
  };

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
              className={styles.input}
            />
            <button onClick={handleAdminLogin} className={styles.saveBtn}>
              Entrar
            </button>
            <div style={{ marginTop: "12px" }}>
              <button onClick={() => setShowAdminModal(false)} className={styles.cancelBtn}>
                Cerrar
              </button>
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

      {/* Contenedor de seleccionados */}
      <div className={styles.selectedContainer}>
        <div className={styles.selectedHeader}>
          🎯 SELECCIONADOS ({selectedItems.length})
        </div>
        <div className={styles.selectedList}>
          {selectedItems.map((item, index) => (
            <div key={index} className={styles.selectedItem}>
              <p>{item.id} - {item.nombre}</p>
              <button onClick={() => handleRemoveSelected(index)}>Eliminar</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
