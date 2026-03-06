// src/components/Panel/Panel.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../lib/db/database";
import { useGrupos } from "./hooks/useGrupos";
import { useProductos } from "./hooks/useProductos";
import { exportDatabase } from "../../lib/db/utils/exportService";
import {
  migrateOrdersToBI,
  migrateSalesToBI
} from "../../lib/db/utils/migrationService";
import { importDatabase } from "../../lib/db/utils/importService";
import styles from "./Panel.module.css";

export default function Panel() {
  const navigate = useNavigate();
  const { importarGrupos } = useGrupos();
  const { importarProductos } = useProductos();

  // Estado para controlar la vista activa en el Dashboard
  const [activeAction, setActiveAction] = useState("overview");

  // Estados para procesos
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [isMigrating, setIsMigrating] = useState(false);
  const [isMigratingSales, setIsMigratingSales] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    const result = await exportDatabase();
    if (result.success) alert("✅ Copia de seguridad guardada en Descargas");
    else alert("❌ Error: " + (result.error?.message || "Desconocido"));
    setIsExporting(false);
  };

  const handleImportExecute = async () => {
    if (!jsonText.trim()) return alert("⚠️ Pesta el JSON primero.");
    if (!window.confirm("⚠️ ¿Restaurar respaldo? Se borrarán datos actuales.")) return;
    setIsImporting(true);
    try {
      JSON.parse(jsonText);
      const result = await importDatabase(jsonText);
      if (result.success) {
        alert("✅ Restaurado. Recargando...");
        window.location.reload();
      } else alert("❌ Error: " + result.error);
    } catch (e) {
      alert("❌ JSON Inválido");
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!window.confirm("⚠️ ¿Importar archivo?")) return;
    setIsImporting(true);
    try {
      const result = await importDatabase(file);
      if (result.success) {
        alert("✅ Restaurado. Recargando...");
        window.location.reload();
      } else alert("❌ Error: " + result.error);
    } catch (e) {
      alert("❌ Error: " + e.message);
    } finally {
      setIsImporting(false);
      event.target.value = null;
    }
  };

  const handleMigrateSalesBI = async () => {
    if (!window.confirm("📈 ¿Normalizar historial de VENTAS?")) return;
    setIsMigratingSales(true);
    try {
      const result = await migrateSalesToBI();
      alert(result.success ? result.message : "❌ Error: " + result.error);
    } catch (e) { alert("❌ Error: " + e.message); }
    finally { setIsMigratingSales(false); }
  };

  const handleMigrateBI = async () => {
    if (!window.confirm("📊 ¿Migrar PEDIDOS al formato BI?")) return;
    setIsMigrating(true);
    try {
      const result = await migrateOrdersToBI();
      alert(result.success ? result.message : "❌ Error: " + result.error);
    } catch (e) { alert("❌ Error: " + e.message); }
    finally { setIsMigrating(false); }
  };

  const handleLoadHistory = async () => {
    if (!window.confirm("📉 ¿Cargar histórico de tasas BCV?")) return;
    setIsLoadingHistory(true);
    try {
      const result = await db.cargarDatosInicialesHistorico();
      alert(result.success ? result.message : "❌ Error: " + result.error);
    } catch (e) { alert("❌ Error: " + e.message); }
    finally { setIsLoadingHistory(false); }
  };

  const handleImportInitialData = async () => {
    if (!window.confirm("📥 ¿Cargar datos iniciales (Grupos/Productos)?")) return;
    const rG = await importarGrupos();
    const rP = await importarProductos();
    alert(`${rG.success ? "✅ Grupos OK" : "❌ Error Grupos"}\n${rP.success ? "✅ Productos OK" : "❌ Error Productos"}`);
  };

  // Renderizado del contenido según la acción seleccionada
  const renderContent = () => {
    switch (activeAction) {
      case "backups":
        return (
          <div className={styles.toolCard}>
            <h2 className={styles.toolTitle}>Gestión de Respaldos (Backups)</h2>
            <p className={styles.toolDescription}>Protege tu información exportando una copia de seguridad o restaura una anterior desde un archivo.</p>
            <div className={styles.actionZone}>
              <button className={styles.primaryButton} onClick={handleExport} disabled={isExporting}>
                {isExporting ? "⌛ Exportando..." : "📤 Exportar Base de Datos (.json)"}
              </button>
              <label className={styles.primaryButton} style={{ cursor: 'pointer' }}>
                {isImporting ? "⌛ Importando..." : "📥 Importar desde Archivo"}
                <input type="file" accept=".json" onChange={handleImportFile} disabled={isImporting} style={{ display: 'none' }} />
              </label>
            </div>
          </div>
        );
      case "import_json":
        return (
          <div className={styles.toolCard}>
            <h2 className={styles.toolTitle}>Importación por Texto (JSON)</h2>
            <p className={styles.toolDescription}>Si tienes el contenido del respaldo en el portapapeles, pégalo aquí para restaurar.</p>
            <textarea
              className={styles.textarea}
              placeholder='Pega aquí el JSON...'
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
            />
            <button className={styles.primaryButton} onClick={handleImportExecute} disabled={isImporting}>
              {isImporting ? "Procesando..." : "🚀 Ejecutar Restauración"}
            </button>
          </div>
        );
      case "bi_migrations":
        return (
          <div className={styles.toolCard}>
            <h2 className={styles.toolTitle}>Inteligencia de Negocio (BI)</h2>
            <p className={styles.toolDescription}>Transforma datos antiguos para que sean compatibles con las nuevas gráficas de rendimiento y costos.</p>
            <div className={styles.actionZone}>
              <button className={styles.primaryButton} onClick={handleMigrateSalesBI} disabled={isMigratingSales} style={{ backgroundColor: '#4a148c' }}>
                {isMigratingSales ? "⚙️ Procesando..." : "📈 Normalizar Ventas (Fase 2)"}
              </button>
              <button className={styles.primaryButton} onClick={handleMigrateBI} disabled={isMigrating} style={{ backgroundColor: '#6a1b9a' }}>
                {isMigrating ? "⚙️ Procesando..." : "📊 Normalizar Pedidos (BI)"}
              </button>
            </div>
          </div>
        );
      case "maintenance":
        return (
          <div className={styles.toolCard}>
            <h2 className={styles.toolTitle}>Mantenimiento del Sistema</h2>
            <p className={styles.toolDescription}>Tareas de configuración inicial y carga de datos maestros.</p>
            <div className={styles.actionZone}>
              <button className={styles.primaryButton} onClick={handleImportInitialData} style={{ backgroundColor: '#16a34a' }}>
                📥 Cargar Grupos y Productos Iniciales
              </button>
              <button className={styles.primaryButton} onClick={handleLoadHistory} disabled={isLoadingHistory} style={{ backgroundColor: '#f39c12' }}>
                {isLoadingHistory ? "⚙️ Cargando..." : "📉 Cargar Histórico Tasas BCV"}
              </button>
            </div>
          </div>
        );
      default:
        return (
          <div className={styles.toolCard}>
            <h2 className={styles.toolTitle}>Bienvenido al Panel de Control</h2>
            <p className={styles.toolDescription}>Selecciona una opción del menú lateral para gestionar la base de datos, realizar migraciones de analítica o configurar el sistema.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '40px' }}>
              <div style={{ padding: '20px', border: '1px solid #eee', borderRadius: '12px', textAlign: 'center' }}>
                <span style={{ fontSize: '2rem' }}>📂</span>
                <h4>Respaldos</h4>
              </div>
              <div style={{ padding: '20px', border: '1px solid #eee', borderRadius: '12px', textAlign: 'center' }}>
                <span style={{ fontSize: '2rem' }}>📊</span>
                <h4>Analítica</h4>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={styles.container}>
      {/* SIDEBAR */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h1 className={styles.sidebarTitle}>Natura Ice Admin</h1>
        </div>

        <nav className={styles.sidebarNav}>
          <div className={styles.navSection}>
            <span className={styles.sectionLabel}>Datos y Seguridad</span>
            <button className={`${styles.navButton} ${activeAction === 'backups' ? styles.navButtonActive : ''}`} onClick={() => setActiveAction('backups')}>
              <span>📂</span> Respaldos y Archivos
            </button>
            <button className={`${styles.navButton} ${activeAction === 'import_json' ? styles.navButtonActive : ''}`} onClick={() => setActiveAction('import_json')}>
              <span>✏️</span> Importación Manual
            </button>
          </div>

          <div className={styles.navSection}>
            <span className={styles.sectionLabel}>Optimización</span>
            <button className={`${styles.navButton} ${activeAction === 'bi_migrations' ? styles.navButtonActive : ''}`} onClick={() => setActiveAction('bi_migrations')}>
              <span>📈</span> Migraciones BI
            </button>
          </div>

          <div className={styles.navSection}>
            <span className={styles.sectionLabel}>Sistema</span>
            <button className={`${styles.navButton} ${activeAction === 'maintenance' ? styles.navButtonActive : ''}`} onClick={() => setActiveAction('maintenance')}>
              <span>🛠️</span> Mantenimiento
            </button>
          </div>
        </nav>

        <div className={styles.sidebarFooter}>
          <button className={`${styles.navButton} ${styles.backBtn}`} onClick={() => navigate("/")}>
            <span>↩️</span> Regresar al Inicio
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className={styles.mainContent}>
        <header className={styles.topBar}>
          <span className={styles.viewTitle}>PANEL DE CONTROL / {activeAction.toUpperCase().replace("_", " ")}</span>
        </header>

        <div className={styles.contentArea}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
}