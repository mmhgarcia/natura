import { useEffect } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import data from "../data/data.json";
import styles from "./Home.module.css";

export default function Home() {
  const [productos, setProductos] = useLocalStorage("productos", []);

  useEffect(() => {
    if (productos.length === 0) {
      setProductos(data.productos);
    }
  }, []);

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Natura Ice</h2>

      <div className={styles.grid}>
        {productos.map((p) => (
          <div key={p.id} className={styles.card}>
            <img
              src={p.imagen}
              alt={p.nombre}
              className={styles.image}
            />
            <p className={styles.name}>{p.id}</p>
          </div>
        ))}
      </div>
    </div>
  );
}