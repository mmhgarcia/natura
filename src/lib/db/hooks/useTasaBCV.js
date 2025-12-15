//src/lib/db/hooks/useTasaBCV.js

import { useEffect, useState } from "react";
import { TasaRepository } from "../repositories/TasaRepository";

export function useTasaBCV() {
  const [tasa, setTasa] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const tasaKey = await TasaRepository.getTasa();
        if (tasaKey) {
          setTasa(tasaKey);
        }
      } catch (error) {
        console.error("Error al cargar la tasa:", error);
        // Opcional: manejar el error (mostrar mensaje al usuario, etc.)
      } finally {
        setLoading(false);
      }
    }
    
    load();
  }, []);

  async function saveTasa(valor) {
    await TasaRepository.saveTasa(valor);
    setTasa(valor);
  }

  return {    
    setTasa,
    saveTasa,
    loading,
    TasaRepository
  };

}
