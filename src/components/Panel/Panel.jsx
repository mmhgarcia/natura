import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGrupos } from "./hooks/useGrupos";
import { useProductos } from "./hooks/useProductos";
import { exportDatabase } from "../../lib/db/utils/exportService"; 
// 1. Importar el servicio de migración creado en la Fase 3
import { migrateOrdersToBI } from "../../lib/db/utils/migrationService";
import styles from "./Panel.module.css";

export default function Panel() {
  const navigate = useNavigate();
  const { importarGrupos } = useGrupos();
  const { importarProductos } = useProductos();
  const [isExporting, setIsExporting] = useState(false);
  // Estado para controlar la ejecución de la migración
  const [isMigrating, setIsMigrating] = useState(false);

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

  // 2. Vincular Función de Migración con Feedback
  const handleMigrateBI = async () => {
    // Feedback de Usuario: Confirmación para evitar ejecuciones accidentales
    const mensajeConfirmacion = "⚠️ ¿Deseas iniciar la migración de pedidos al formato BI?\n\n" +
                               "Esta acción transformará los pedidos antiguos para habilitar la analítica financiera. " +
                               "Se recomienda realizar un backup previo.";
    
    if (!window.confirm(mensajeConfirmacion)) return;

    setIsMigrating(true);
    try {
      const result = await migrateOrdersToBI();
      
      if (result.success) {
        // Feedback de Usuario: Alerta informativa con el éxito de la operación
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

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>PANEL DE CONTROL</h1>
      
      <div className={styles.buttons}>
        <button className={styles.button} onClick={handleExport} disabled={isExporting}>
          {isExporting ? "⌛ Exportando..." : "📤 Exportar DB"}
        </button>

        {/* 3. Nuevo Botón de Migración con estilo styles.button */}
        <button 
          className={styles.button} 
          onClick={handleMigrateBI} 
          disabled={isMigrating}
          style={{ backgroundColor: '#6a1b9a' }} // Color púrpura para diferenciar función BI
        >
          {isMigrating ? "⚙️ Migrando..." : "📊 Migrar Pedidos a BI"}
        </button>

        <button className={styles.button} onClick={importarGrupos}>
          📥 Cargar Datos Iniciales (Grupos)
        </button>

        <button className={styles.button} onClick={() => navigate("/tasabcv")}>
          💰 Tasa BCV
        </button>

        <button className={styles.button} onClick={() => navigate("/admingrupos")}>
          🍦 Grupos
        </button>

        <button className={styles.button} onClick={() => navigate("/adminproductos")}>
          📦 Productos
        </button>

        <button className={`${styles.button} ${styles.back}`} onClick={() => navigate("/")}>
          ↩️ Regresar
        </button>
      </div>
    </div>
  );
}