import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGrupos } from "./hooks/useGrupos";
import { useProductos } from "./hooks/useProductos";
import { exportDatabase } from "../../lib/db/utils/exportService"; // Importar servicio
import styles from "./Panel.module.css";

export default function Panel() {
    const navigate = useNavigate();
    const { importarGrupos } = useGrupos();
    const { importarProductos } = useProductos();
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        const result = await exportDatabase();
        if (result.success) {
            alert("✅ Copia de seguridad guardada en Descargas");
        } else {
            alert("❌ Error al exportar: " + (result.error?.message || "Error desconocido"))
        }
        setIsExporting(false);
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>PANEL DE CONTROL</h1>

            <div className={styles.buttons}>
                <button className={`${styles.button} ${styles.primary}`} onClick={handleExport} disabled={isExporting}>
                    {isExporting ? "⌛ Exportando..." : "📤 Exportar DB"}
                </button>

                <button className={`${styles.button} ${styles.primary}`} onClick={importarGrupos}>
                    📥 Cargar Datos Iniciales
                </button>

                <button className={styles.button} onClick={() => navigate("/tasabcv")}>Tasa BCV</button>
                <button className={styles.button} onClick={() => navigate("/admingrupos")}>Grupos</button>
                <button className={styles.button} onClick={() => navigate("/adminproductos")}>Productos</button>

                <button className={`${styles.button} ${styles.back}`} onClick={() => navigate("/")}>
                    ↩️ Regresar
                </button>
            </div>
        </div>
    );
}