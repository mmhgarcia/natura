// src/lib/db/repositories/TasaRepository.js
import { db } from "../database";

const TASA_KEY = 'tasa';

export const TasaRepository = {
  async getTasa() {
    // Busca en la tabla 'config' que es la correcta según el esquema
    return await db.getConfigValue(TASA_KEY);
  },

  async saveTasa(valor) {
    // Usa el método setConfigValue definido en NaturaDBClass
    return await db.setConfigValue(TASA_KEY, Number(valor));
  },

  async convertirABs(valorenDolar) {
    const valor = await db.getConfigValue(TASA_KEY);
    
    if (!valor || typeof valor !== "number") {
      console.warn("Tasa no configurada en DB. Retornando 0.");
      return 0;
    }
    
    return valor * Number(valorenDolar || 0);
  }
};
