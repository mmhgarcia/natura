/**
 * Formatea una fecha en formato YYYY-MM-DD a DD/MM/YYYY
 * sin usar el constructor new Date() para evitar problemas de zona horaria (UTC).
 * @param {string} dateStr - Fecha en formato YYYY-MM-DD
 * @returns {string} - Fecha en formato DD/MM/YYYY
 */
export const formatDate = (dateStr) => {
    try {
        if (!dateStr) return '---';
        const str = String(dateStr);
        const cleanDate = str.split('T')[0];
        const parts = cleanDate.split('-');

        if (parts.length !== 3) return str;

        const [year, month, day] = parts;
        return `${day}/${month}/${year}`;
    } catch (e) {
        console.error("Error formatting date:", e);
        return String(dateStr || '---');
    }
};
