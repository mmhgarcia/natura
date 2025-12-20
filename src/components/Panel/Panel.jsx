// src/components/Panel/Panel.js
import { useNavigate } from "react-router-dom";
import { useGrupos } from "./hooks/useGrupos";
import { useProductos } from "./hooks/useProductos";
import styles from "./Panel.module.css";

export default function Panel() {
  
  const navigate = useNavigate();

  const { importarGrupos } = useGrupos();
  const { importarProductos } = useProductos();

  // Función simple para importar datos
  async function handleImportarDatos() {
    try {

      // 1. Importar grupos
      const resultadoGrupos = await importarGrupos();
      console.log('Grupos:', resultadoGrupos);

      // 2. Importar productos
      const resultadoProductos = await importarProductos();
      console.log('Productos:', resultadoProductos);

      alert(`✅ Datos importados\n\n`)
      
    } catch (error) {
      console.error('Error general:', error);
      alert('❌ Error inesperado: ' + error.message);
    }
  }

  return (
    <div className={styles.container}>

      <h2 className={styles.title}>PANEL DE CONTROL</h2>

      {/* Acción principal */}
      <button 
          className={`${styles.button} ${styles.primary}`}
          onClick={handleImportarDatos}          
        >
        📥 Cargar Datos Iniciales
      </button>

      <div className={styles.buttons}>
        {/* Navegación */}
        <button className={styles.button} onClick={() => navigate("/tasabcv")}>
          Tasa BCV
        </button>
        
        <button className={styles.button} onClick={() => navigate("/admingrupos")}>
          Grupos
        </button>

        <button className={styles.button} onClick={() => navigate("/adminproductos")}>
          Productos
        </button>
        
        {/* Volver */}
        <button 
          className={`${styles.button} ${styles.back}`}
          onClick={() => navigate("/")}
        >
          ↩️ Regresar
        </button>
      </div>
    </div>
  );
}