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
  }

};

