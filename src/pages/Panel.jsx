import { useNavigate } from "react-router-dom";
import styles from "./Panel.module.css";

import gruposData from '../data/grupos.json'; // Cambia el nombre para claridad
import Importer from '../lib/db/utils/Importer.js';

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
      // 3. Usar los datos importados directamente
      const resultado = await Importer.ImportGrupos(gruposData);
      
      console.log('Resultado:', resultado);
      
      // 4. Mostrar mensaje según resultado
      if (resultado.success) {
        alert(`✅ ${resultado.count} grupos importados exitosamente!`);
      } else {
        alert(`❌ Error: ${resultado.error}`);
      }
      
    } catch (error) {
      console.error('Error:', error);
      alert(`❌ Error inesperado: ${error.message}`);
    }
  };

  const verificarImportacion = async () => {
    try {
      const { db } = await import('../lib/db/database.js');
      const grupos = await db.grupos.toArray();
      
      console.log('📊 Grupos en base de datos:');
      console.table(grupos);
      
      alert(`✅ ${grupos.length} grupos encontrados\n\n` +
            grupos.map(g => `${g.nombre}: ${g.precio}`).join('\n'));
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>PANEL</h2>

      <div className={styles.buttons}>
        {/* Tus botones de navegación */}
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
          onClick={loadData} // Sin arrow function innecesaria
        >
          Carga Inicial de Datos
        </button>

        <button
          className={styles.button}
          onClick={verificarImportacion}
          style={{backgroundColor: '#28a745'}}
        >
          Verificar Importación
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