import { useNavigate } from "react-router-dom";
import styles from "./Panel.module.css";

import Importer from '../lib/db/utils/Importer.js';
// y lo usarías asi: Importer.ImportGrupos(), Importer.ImportProductos()

export default function Panel() {

  const navigate = useNavigate();

  const loadData = async () => {

    // 1. Mostrar confirmación
    const confirmar = window.confirm(
      '¿Estás seguro de realizar la carga inicial de datos?\n\n' +
      'Esta acción borrará todos los grupos existentes y cargará los datos por defecto.'
    );
    
    // 2. Si el usuario cancela, salir
    if (!confirmar) {
      console.log('Carga de datos cancelada por el usuario');
      return;
    }

    try {
      // Cargar datos desde un archivo JSON en el servidor
      const response = await fetch('/data/grupos.json');
      
      if (!response.ok) throw new Error('No se pudo cargar el archivo');
      
      const jsonData = await response.json();
      const resultado = await Importer.ImportGrupos(jsonData);
      
      console.log('Resultado:', resultado);
      alert("Grupos Importados!")
      
    } catch (error) {
      console.error('Error:', error);
      alert("Error al Importar Grupos!")
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>PANEL</h2>

      <div className={styles.buttons}>
        
        <button
          className={styles.button}
          onClick={() => navigate("/tasabcv")}
        >
          Tasa BCV
        </button>

        <button
          className={styles.button}
          onClick={() => navigate("/adminproductos")}
        >
          Productos
        </button>

        <button
          className={styles.button}
          onClick={() => navigate("/admingrupos")}
        >
          Grupos
        </button>
        
        <button
          className={styles.button}
          onClick={() => loadData()}
        >
          Carga Inicial de Datos
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
