import { useState, useEffect, useRef } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import data from "../data/data.json";
import json_grupos from "../data/grupos.json";
import styles from "./Home.module.css";

export default function Home() {
  const [productos, setProductos] = useLocalStorage("productos", []);
  const [grupos, setGrupos] = useLocalStorage("grupos", []);
  const [adminMode, setAdminMode] = useLocalStorage("adminMode", false);
  const clickCounter = useRef(0);

  const handleSecretClick = () => {
    clickCounter.current += 1;

    if (clickCounter.current >= 3) {
      const pass = prompt("Ingrese contraseña de administrador:");

      if (pass === "natura2025") {
        setAdminMode(true);
        alert("Modo administrador activado");
      }

      clickCounter.current = 0;
    }
  };

 
  useEffect(() => {
    if (productos.length === 0) {
      setProductos(data.productos);
    }

    if (grupos.length === 0) {
      setGrupos(json_grupos);
    }
  }, []);

  return (
    <div className={styles.container}>
      
      <h2 className={styles.title} onClick={handleSecretClick}>
        Natura Ice
      </h2>

      {adminMode && (
        <button
          onClick={() => navigate("/admin")}
          className={styles.adminButton}
        >
          Entrar al Panel Admin
        </button>
      )}

      <div className={styles.grid}>
        {productos.map((p) => (
          <div key={p.id} className={styles.card}>
            <img
              src={p.imagen}
              alt={p.nombre}
              className={styles.image}
            />
            <p>{p.id}</p>
          </div>
        ))}
      </div>
    </div>
  );
}