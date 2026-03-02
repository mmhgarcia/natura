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
import { importDatabase } from "../../lib/db/utils/importService";
import styles from "./Panel.module.css";

export default function Panel() {
  const navigate = useNavigate();
  const { importarGrupos } = useGrupos();
  const { importarProductos } = useProductos();

  // Estados para control de procesos
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [jsonText, setJsonText] = useState("");
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
   * Maneja la importación de la base de datos desde el texto del textarea
   */
  const handleImportExecute = async () => {
    if (!jsonText.trim()) {
      alert("⚠️ Por favor, pega el contenido del archivo JSON primero.");
      return;
    }

    if (!window.confirm("⚠️ ¿Deseas IMPORTAR este respaldo?\n\nSe sobrescribirán todos los datos actuales por los que has pegado.")) {
      return;
    }

    setIsImporting(true);
    try {
      // Validar si es un JSON válido antes de enviarlo
      try {
        JSON.parse(jsonText);
      } catch (e) {
        throw new Error("El texto no es un JSON válido. Asegúrate de copiar todo el contenido del archivo.");
      }

      const result = await importDatabase(jsonText);
      if (result.success) {
        alert("✅ Base de datos restaurada correctamente. La aplicación se recargará.");
        window.location.reload();
      } else {
        alert("❌ Error al importar: " + (result.error || "Error desconocido"));
      }
    } catch (error) {
      alert("❌ Error: " + error.message);
    } finally {
      setIsImporting(false);
    }
  };

  /**
   * Maneja la importación de la base de datos desde un archivo JSON
   */
  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!window.confirm("⚠️ ¿Deseas IMPORTAR este respaldo?\n\nSe sobrescribirán todos los datos actuales por los del archivo seleccionado.")) {
      event.target.value = null; // Limpiar input para reintentar con el mismo archivo
      return;
    }

    setIsImporting(true);
    try {
      const result = await importDatabase(file);
      if (result.success) {
        alert("✅ Base de datos restaurada correctamente. La aplicación se recargará.");
        window.location.reload(); // Recargar para asegurar que los hooks lean los nuevos datos
      } else {
        alert("❌ Error al importar: " + (result.error || "Error desconocido"));
      }
    } catch (error) {
      alert("❌ Error crítico: " + error.message);
    } finally {
      setIsImporting(false);
      event.target.value = null; // Limpiar input
    }
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
   * Importación masiva de grupos y productos iniciales [10, 11]
   */
  const handleImportInitialData = async () => {
    if (!window.confirm("¿Importar datos iniciales (Grupos y Productos)? Se sobrescribirán los datos existentes.")) return;

    const resultGrupos = await importarGrupos();
    const resultProductos = await importarProductos();

    let mensaje = "";

    if (resultGrupos.success) {
      mensaje += `✅ ${resultGrupos.message}\n`;
    } else {
      mensaje += `❌ Error Grupos: ${resultGrupos.error}\n`;
    }

    if (resultProductos.success) {
      mensaje += `✅ ${resultProductos.message}\n`;
    } else {
      mensaje += `❌ Error Productos: ${resultProductos.error}\n`;
    }

    alert(mensaje);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>PANEL DE CONTROL</h1>

      <div className={styles.buttons}>

        {/* Importación de Configuración Inicial [12] */}
        <button className={styles.button} onClick={handleImportInitialData}>
          📥 Cargar Datos Iniciales (Grupos y Productos)
        </button>

        {/* Gestión de Datos y Backups [4] */}
        <button
          className={styles.button}
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting ? "⌛ Exportando..." : "📤 Exportar DB"}
        </button>

        {/* Importación de Respaldo */}
        <label className={styles.button} style={{ cursor: 'pointer', textAlign: 'center' }}>
          {isImporting ? "⌛ Importando..." : "📥 Importar DB (Archivo)"}
          <input
            type="file"
            accept="application/json,.json"
            onChange={handleImport}
            disabled={isImporting}
            style={{ display: 'none' }}
          />
        </label>

        {/* Botón para abrir el Modal de Importación */}
        <button
          className={styles.button}
          onClick={() => setShowImportModal(true)}
        >
          📥 Importar DB (Pegar JSON)
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


        <hr style={{ width: '80%', margin: '20px 0', opacity: 0.2 }} />


        {/* Botón Regresar [12] */}
        <button
          className={`${styles.button} ${styles.back}`}
          onClick={() => navigate("/")}
        >
          ↩️ Regresar
        </button>
      </div>

      {/* MODAL DE IMPORTACIÓN */}
      {showImportModal && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Importar Base de Datos</h2>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>
              Abre el archivo de respaldo en tu celular, copia todo su contenido y pégalo aquí abajo.
            </p>

            <textarea
              className={styles.textarea}
              placeholder='Pega aquí el contenido JSON...'
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
            />

            <div className={styles.modalActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => {
                  setShowImportModal(false);
                  setJsonText("");
                }}
                disabled={isImporting}
              >
                Cancelar
              </button>
              <button
                className={styles.confirmBtn}
                onClick={handleImportExecute}
                disabled={isImporting}
              >
                {isImporting ? "Procesando..." : "Ejecutar Importación"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}