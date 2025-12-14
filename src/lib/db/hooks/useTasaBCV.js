//src/lib/db/hooks/useTasaBCV.js

import { useEffect, useState } from "react";
import { TasaRepository } from "../repositories/TasaRepository";

export function useTasaBCV() {
  const [tasa, setTasa] = useState("");
  const [loading, setLoading] = useState(true);
  const [repository, setTasaRepository] = useState(TasaRepository);

  useEffect(() => {
    async function load() {
      const data = await TasaRepository.getTasa();
      if (data) {
        setTasa(data.valor);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function saveTasa(valor) {
    await TasaRepository.saveTasa(valor);
    setTasa(valor);
  }

  return {
    tasa,
    setTasa,
    saveTasa,
    loading,
    repository
  };
  
}
