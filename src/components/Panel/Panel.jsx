// src/components/Panel/Panel.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../lib/db/database"; // Referencia a la base de datos dbTasaBCV [1, 2]
import { useGrupos } from "./hooks/useGrupos"; // [3]
import { useProductos } from "./hooks/useProductos"; // [4]
import { exportDatabase } from "../../lib/db/utils/exportService"; // [3, 5]
import { migrateOrdersToBI } from "../../lib/db/utils/migrationService"; // [3, 6]
import styles from "./Panel.module.css"; // [3, 7]

export default function Panel() {
    const navigate = useNavigate(); // [3]
    const { importarGrupos } = useGrupos(); // [3]
    const { importarProductos } = useProductos(); // [4]

    // Estados para control de procesos de carga
    const [isExporting, setIsExporting] = useState(false); // [4]
    const [isMigrating, setIsMigrating] = useState(false); // [4]
    const [isLoadingHistory, setIsLoadingHistory] = useState(false); // Nuevo estado Fase 1

    /**
     * Maneja la exportación de la base de datos a un archivo JSON [5, 8]
     */
    const handleExport = async () => {
        setIsExporting(true);
        const result = await exportDatabase();
        if (result.success) {
            alert("✅ Copia de seguridad guardada en Descargas"); // [4]
        } else {
            alert("❌ Error al exportar: " + (result.error?.message || "Error desconocido"));
        }
        setIsExporting(false);
    };

    /**
     * Ejecuta la migración de pedidos antiguos al formato BI detallado [6, 9]
     */
    const handleMigrateBI = async () => {
        const mensajeConfirmacion = "⚠️ ¿Deseas iniciar la migración de pedidos al formato BI?\n\n" +
            "Esta acción transformará los pedidos antiguos para habilitar la analítica financiera."; // [9]
        
        if (!window.confirm(mensajeConfirmacion)) return;

        setIsMigrating(true);
        try {
            const result = await migrateOrdersToBI();
            if (result.success) {
                alert(result.message); // [10]
            } else {
                alert("❌ Error en la migración: " + result.error);
            }
        } catch (error) {
            alert("❌ Error crítico: " + error.message);
        } finally {
            setIsMigrating(false);
        }
    };

    /**
     * Fase 1 Rediseño: Carga masiva de los 11 días de histórico recolectados
     */
    const handleLoadHistory = async () => {
      if (!window.confirm("¿Deseas cargar los 11 días de histórico de tasas BCV?")) return;
      
      setIsLoadingHistory(true);
      try {
          // Ejecutamos la carga en IndexedDB [1]
          const result = await db.cargarDatosInicialesHistorico();
          
          if (result.success) {
              // Ahora result.message existe y no será undefined
              alert(result.message); 
          } else {
              alert("❌ Error: " + result.error);
          }
      } catch (err) {
          alert("❌ Error crítico: " + err.message);
      } finally {
          setIsLoadingHistory(false);
      }
  };

    /**
     * Importación masiva de grupos desde el archivo grupos.json [11, 12]
     */
    const handleImportGrupos = async () => {
        if (!window.confirm("¿Importar grupos iniciales? Se borrarán los actuales.")) return;
        const result = await importarGrupos();
        alert(result.message);
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>PANEL DE CONTROL</h1>

            <div className={styles.buttons}>
                {/* Gestión de Datos y Backups */}
                <button 
                    className={styles.button} 
                    onClick={handleExport} 
                    disabled={isExporting}
                >
                    {isExporting ? "⌛ Exportando..." : "📤 Exportar DB"}
                </button>

                {/* Migración Analítica BI */}
                <button 
                    className={styles.button} 
                    onClick={handleMigrateBI} 
                    disabled={isMigrating}
                    style={{ backgroundColor: '#6a1b9a' }} // Púrpura para BI [13]
                >
                    {isMigrating ? "⚙️ Migrando..." : "📊 Migrar Pedidos a BI"}
                </button>

                {/* NUEVO: Carga de Histórico de Tasas (Fase 1) */}
                <button 
                    className={styles.button} 
                    onClick={handleLoadHistory}
                    disabled={isLoadingHistory}
                    style={{ backgroundColor: '#f39c12' }} // Naranja para histórico
                >
                    {isLoadingHistory ? "⚙️ Cargando..." : "📈 Cargar Histórico BCV"}
                </button>

                {/* Importación de Configuración Inicial */}
                <button className={styles.button} onClick={handleImportGrupos}>
                    📥 Cargar Datos Iniciales (Grupos)
                </button>

                {/* Accesos Directos a Módulos [13] */}
                <button className={styles.button} onClick={() => navigate("/tasabcv")}>
                    💰 Tasa BCV
                </button>

                <button className={styles.button} onClick={() => navigate("/admingrupos")}>
                    🍦 Grupos
                </button>

                <button className={styles.button} onClick={() => navigate("/adminproductos")}>
                    📦 Productos
                </button>

                {/* Botón Regresar [14] */}
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