// src/lib/db/repositories/TasaRepository.js

import { db } from "../database";

const TASA_ID = 1;

export const TasaRepository = {

  async getTasa() {

    return await db.tasa.get(TASA_ID);

  },

  async saveTasa(valor) {

    await db.tasa.put({
      
      id: TASA_ID,
      
      valor: Number(valor),
      
      updatedAt: new Date()
    
    });
  
  },

  async convertirABs(valorenDolar) {
    
    const tasa = await db.tasa.get(TASA_ID);

    if (!tasa || typeof tasa.valor !== "number") {

      return 0;

    }

    return tasa.valor * Number(valorenDolar || 0);
  
  }

};

