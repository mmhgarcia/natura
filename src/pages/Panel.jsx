import { useNavigate } from "react-router-dom";
import styles from "./Panel.module.css";

export default function Panel() {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>PANEL</h2>

      <div className={styles.buttons}>
        <button
          className={styles.button}
          onClick={() => navigate("/admin")}
        >
          Producción
        </button>

        <button
          className={styles.button}
          onClick={() => navigate("/admin-grupos")}
        >
          Grupos
        </button>

        <button
          className={`${styles.button} ${styles.back}`}
          onClick={() => navigate("/")}
        >
          Regresar
        </button>
      </div>
    </div>
  );
}
