// src/lib/db/utils/tasaUtil.js
import { db } from '../database.js'; // This is correct if the file is in /utils/ [1]

export async function getTasaBCV() {
  try {
        // CAMBIO: Ahora llama al método que prioriza el histórico [5, 6]
        const valor = await db.getUltimaTasaBCV();
        return valor ? parseFloat(valor) : 0;
    } catch (error) {
        console.error('Error obteniendo tasa desde utils:', error);
        return null;
    }
}

export async function calcularEnDolares(bs, tasa = null) {
  try {
    if (!tasa) {
      tasa = await getTasaBCV();
    }

    if (!tasa || tasa <= 0) {
      console.warn('Cálculo cancelado: Tasa inválida');
      return null;
    }

    const dolares = parseFloat(bs) / parseFloat(tasa);
    return Math.round(dolares * 100) / 100;
  } catch (error) {
    console.error('Error calculando conversión:', error);
    return null;
  }
}
