// src/lib/db/utils/tasaUtils.js
import { db } from '../database.js';

export async function getTasaBCV() {
  try {
    const config = await db.config.get('tasa');
    
    if (config && config.valor) {
      // Siempre retornar como número con punto decimal
      return parseFloat(config.valor);
    }
    
    return null; // O un valor por defecto
  } catch (error) {
    console.error('Error obteniendo tasa:', error);
    return null;
  }
}

export async function calcularEnDolares(bs, tasa = null) {
  try {
    // Si no se pasa tasa, obtenerla de la DB
    if (!tasa) {
      tasa = await getTasaBCV();
    }
    
    if (!tasa || tasa <= 0) {
      console.warn('Tasa BCV no configurada o inválida');
      return null;
    }
    
    // Calcular con precisión de 2 decimales
    const dolares = parseFloat(bs) / parseFloat(tasa);
    return Math.round(dolares * 100) / 100;
    
  } catch (error) {
    console.error('Error calculando conversión:', error);
    return null;
  }
}