import { useEffect, useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useNavigate } from "react-router-dom";
import data from "../data/data.json";
import styles from "./Home.module.css";

export default function Home() {
  const navigate = useNavigate();
  const [productos, setProductos] = useLocalStorage("productos", []);
  const [adminMode, setAdminMode] = useLocalStorage("adminMode", false);
  const [adminPassword, setAdminPassword] = useState("");

  useEffect(() => {
    if (productos.length === 0) {
      setProductos(data.productos);
    }
  }, []);

  const handleAdminLogin = () => {
    if (adminPassword === "1234") { // clave correcta
      setAdminMode(true);
      navigate("/admin"); // redirige automáticamente
    } else {
      alert("Clave incorrecta");
    }
  };

  const handleAdminLogout = () => {
    setAdminMode(false);
    setAdminPassword("");
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Natura Ice</h2>

      {/* Input de clave para activar Admin */}
      {!adminMode && (
        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <input
            type="password"
            placeholder="Clave Admin"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            style={{ padding: "6px 10px", fontSize: "1rem", marginRight: "8px" }}
          />
          <button onClick={handleAdminLogin} style={{ padding: "6px 12px" }}>
            Entrar Admin
          </button>
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
        {productos.map((p) => (
          <div key={p.id} className={styles.card}>
            <img src={p.imagen} alt={p.nombre} className={styles.image} />
            <p>{p.id}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
