import { db } from '../database';
import 'dexie-export-import';

export const importDatabase = async (input) => {
    try {
        if (!input) {
            return { success: false, error: 'No se proporcionó ningún dato' };
        }

        let file = input;

        // Si el input es un string, lo convertimos a Blob
        if (typeof input === 'string') {
            file = new Blob([input], { type: 'application/json' });
        }

        // Importar la base de datos usando dexie-export-import
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
