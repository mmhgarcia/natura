import { db } from '../database';
import 'dexie-export-import';

export const importDatabase = async (file) => {
    try {
        if (!file) {
            return { success: false, error: 'No se seleccionó ningún archivo' };
        }

        // Importar la base de datos usando dexie-export-import
        // Esto sobrescribirá los datos actuales si el nombre de la BD coincide
        await db.db.import(file, {
            overwriteValues: true,
            clearTablesBeforeImport: true,
            progressCallback: ({ totalRows, completedRows }) => {
                console.log(`Import progress: ${completedRows}/${totalRows}`);
            }
        });

        return { success: true };
    } catch (error) {
        console.error("Error importing IndexedDB:", error);
        return { success: false, error: error.message || error };
    }
};
