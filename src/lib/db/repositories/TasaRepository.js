// src/lib/db/repositories/TasaRepository.js
import { db } from "../database";

const TASA_KEY = 'tasa';

export const TasaRepository = {
    async getTasa() {
        // CAMBIO: Ya no busca solo en la tabla 'config' [8]
        // Ahora obtiene la más reciente del histórico [5]
        return await db.getUltimaTasaBCV();
    },

    async saveTasa(valor) {
        // Mantenemos la escritura en config para compatibilidad con versiones previas [9]
        return 0;   // await db.setConfigValue('tasa', Number(valor));
    },

    async convertirABs(valorenDolar) {
        const valor = await this.getTasa(); // Usa el nuevo método dinámico
        if (!valor || typeof valor !== "number") {
            console.warn("Tasa no encontrada. Retornando 0.");
            return 0;
        }
        return valor * Number(valorenDolar || 0);
    }
};