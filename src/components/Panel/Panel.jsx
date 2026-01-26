// src/components/Panel/Panel.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../lib/db/database"; 
import { useGrupos } from "./hooks/useGrupos"; 
import { useProductos } from "./hooks/useProductos"; 
import { exportDatabase } from "../../lib/db/utils/exportService"; 
import { 
  migrateOrdersToBI, 
  migrateSalesToBI // Fase 2: Nueva importación para transformación de ventas
} from "../../lib/db/utils/migrationService"; 
import styles from "./Panel.module.css"; 

export default function Panel() {
  const navigate = useNavigate(); 
  const { importarGrupos } = useGrupos(); 
  const { importarProductos } = useProductos(); 

  // Estados para control de procesos
  const [isExporting, setIsExporting] = useState(false); 
  const [isMigrating, setIsMigrating] = useState(false); // Pedidos
  const [isMigratingSales, setIsMigratingSales] = useState(false); // Fase 2: Ventas
  const [isLoadingHistory, setIsLoadingHistory] = useState(false); 

  /**
   * Maneja la exportación de la base de datos a un archivo JSON [4, 5]
   */
  const handleExport = async () => {
    setIsExporting(true);
    const result = await exportDatabase();
    if (result.success) {
      alert("✅ Copia de seguridad guardada en Descargas"); 
    } else {
      alert("❌ Error al exportar: " + (result.error?.message || "Error desconocido"));
    }
    setIsExporting(false);
  };

  /**
   * Fase 2: Ejecuta la migración de ventas antiguas al formato BI [Plan de Mejoras]
   * Agrega costos y utilidades retroactivas a la tabla 'ventas'.
   */
  const handleMigrateSalesBI = async () => {
    const mensajeConfirmacion = "📈 ¿Deseas normalizar el historial de VENTAS para BI?\n\n" +
      "Se asignarán costos y utilidades a las ventas pasadas basándose en los grupos actuales.";
    
    if (!window.confirm(mensajeConfirmacion)) return;

    setIsMigratingSales(true);
    try {
      const result = await migrateSalesToBI();
      if (result.success) {
        alert(result.message);
      } else {
        alert("❌ Error: " + result.error);
      }
    } catch (error) {
      alert("❌ Error crítico: " + error.message);
    } finally {
      setIsMigratingSales(false);
    }
  };

  /**
   * Ejecuta la migración de pedidos antiguos al formato BI detallado [6, 7]
   */
  const handleMigrateBI = async () => {
    const mensajeConfirmacion = "⚠️ ¿Deseas iniciar la migración de pedidos al formato BI?\n\n" +
      "Esta acción transformará los pedidos antiguos para habilitar la analítica financiera."; 

    if (!window.confirm(mensajeConfirmacion)) return;

    setIsMigrating(true);
    try {
      const result = await migrateOrdersToBI();
      if (result.success) {
        alert(result.message); 
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
   * Carga masiva de los días de histórico de tasas BCV recolectados [8, 9]
   */
  const handleLoadHistory = async () => {
    if (!window.confirm("¿Deseas cargar el histórico de tasas BCV?")) return;
    setIsLoadingHistory(true);
    try {
      const result = await db.cargarDatosInicialesHistorico();
      if (result.success) {
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
   * Importación masiva de grupos iniciales [10, 11]
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
        {/* Gestión de Datos y Backups [4] */}
        <button 
          className={styles.button} 
          onClick={handleExport} 
          disabled={isExporting}
        >
          {isExporting ? "⌛ Exportando..." : "📤 Exportar DB"}
        </button>

        {/* Fase 2: Migración Analítica de Ventas (Snapshot Financiero) */}
        <button 
          className={styles.button} 
          onClick={handleMigrateSalesBI}
          disabled={isMigratingSales}
          style={{ backgroundColor: '#4a148c' }} // Púrpura oscuro para diferenciar
        >
          {isMigratingSales ? "⚙️ Transformando..." : "📈 Migrar Ventas a BI"}
        </button>

        {/* Migración Analítica de Pedidos [3] */}
        <button 
          className={styles.button} 
          onClick={handleMigrateBI} 
          disabled={isMigrating}
          style={{ backgroundColor: '#6a1b9a' }} 
        >
          {isMigrating ? "⚙️ Migrando..." : "📊 Migrar Pedidos a BI"}
        </button>

        {/* Carga de Histórico de Tasas [3] */}
        <button 
          className={styles.button} 
          onClick={handleLoadHistory} 
          disabled={isLoadingHistory}
          style={{ backgroundColor: '#f39c12' }} 
        >
          {isLoadingHistory ? "⚙️ Cargando..." : "📉 Cargar Histórico BCV"}
        </button>

        {/* Importación de Configuración Inicial [12] */}
        <button className={styles.button} onClick={handleImportGrupos}>
          📥 Cargar Datos Iniciales (Grupos)
        </button>

        <hr style={{ width: '80%', margin: '20px 0', opacity: 0.2 }} />

        {/* Accesos Directos a Módulos [12] */}
        <button className={styles.button} onClick={() => navigate("/tasabcv")}>
          💰 Tasa BCV
        </button>

        <button className={styles.button} onClick={() => navigate("/admingrupos")}>
          🍦 Grupos
        </button>

        <button className={styles.button} onClick={() => navigate("/adminproductos")}>
          📦 Productos
        </button>

        {/* Botón Regresar [12] */}
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