import { db } from '../database';
import 'dexie-export-import'; // Required to extend Dexie functionality [4]

export const exportDatabase = async () => {
    try {
        // Use db.db to access the actual Dexie instance defined in your class [1, 2]
        const blob = await db.db.export({
            prettyJson: true,
            progressCallback: ({ totalRows, completedRows }) => {
                console.log(`Export progress: ${completedRows}/${totalRows}`);
            }
        });

        // Fixed filename as requested to avoid string manipulation errors
        const fileName = 'backup_natura_ice.json';

        // Standard logic for triggering a download in Android browsers [5]
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();

        // Cleanup resources
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        return { success: true };
    } catch (error) {
        console.error("Error exporting IndexedDB:", error);
        return { success: false, error };
    }
};