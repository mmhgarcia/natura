import os
from pathlib import Path

def implementar_mejoras():
    base_path = Path(".")
    
    # 1. Archivos a modificar/eliminar
    tasa_jsx = base_path / "src" / "pages" / "Tasa.jsx"
    tasa_repository = base_path / "src" / "lib" / "db" / "repositories" / "TasaRepository.js"
    tasa_util = base_path / "src" / "lib" / "db" / "utils" / "tasaUtil.js"

    print("--- Iniciando refactorización del Proyecto Natura ---")

    # PASO 1: Eliminar Tasa.jsx (Obsoleto por localStorage)
    if tasa_jsx.exists():
        try:
            os.remove(tasa_jsx)
            print(f"✓ Eliminado: {tasa_jsx} (Uso de localStorage detectado)")
        except Exception as e:
            print(f"✗ Error al eliminar {tasa_jsx}: {e}")
    else:
        print(f"! El archivo {tasa_jsx} ya no existe o fue movido.")

    # PASO 2: Corregir TasaRepository.js (Unificar con tabla 'config')
    new_repository_content = """// src/lib/db/repositories/TasaRepository.js
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
"""
    try:
        with open(tasa_repository, "w", encoding="utf-8") as f:
            f.write(new_repository_content)
        print(f"✓ Actualizado: {tasa_repository} (Ahora usa tabla 'config')")
    except Exception as e:
        print(f"✗ Error al escribir en {tasa_repository}: {e}")

    # PASO 3: Sincronizar tasaUtil.js
    new_util_content = """// src/lib/db/utils/tasaUtil.js
import { db } from '../database.js';

export async function getTasaBCV() {
  try {
    const valor = await db.getConfigValue('tasa');
    return valor ? parseFloat(valor) : null;
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
"""
    try:
        with open(tasa_util, "w", encoding="utf-8") as f:
            f.write(new_util_content)
        print(f"✓ Sincronizado: {tasa_util} (Consistencia con IndexedDB)")
    except Exception as e:
        print(f"✗ Error al escribir en {tasa_util}: {e}")

    print("--- Refactorización completada con éxito ---")

if __name__ == "__main__":
    implementar_mejoras()