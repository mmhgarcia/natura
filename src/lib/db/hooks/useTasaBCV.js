// src/lib/db/hooks/useTasaBCV.js
import { useState, useEffect } from 'react';
import { db } from '../database.js';

export function useTasaBCV() {
  const [tasa, setTasa] = useState('');
  const [loading, setLoading] = useState(true);

  // Cargar tasa al inicio
  useEffect(() => {
    async function loadTasa() {
      try {
        // Buscar en la tabla 'config' donde clave = 'tasa'
        const config = await db.config.get('tasa');
        
        if (config && config.valor) {
          // Asegurar que siempre tenga punto decimal
          const valor = String(config.valor).replace(',', '.');
          setTasa(valor);
        } else {
          setTasa(''); // Vacío si no existe
        }
      } catch (error) {
        console.error('Error cargando tasa:', error);
        setTasa('');
      } finally {
        setLoading(false);
      }
    }

    loadTasa();
  }, []);

  // Guardar tasa
  const saveTasa = async (valor) => {
    try {
      // Normalizar: reemplazar coma por punto
      const tasaNormalizada = String(valor).replace(',', '.');
      
      // Guardar como número con punto decimal
      const tasaNumero = parseFloat(tasaNormalizada);
      
      // Verificar que sea un número válido
      if (isNaN(tasaNumero)) {
        console.error('Valor no es un número:', valor);
        return false;
      }

      // Guardar en IndexedDB
      await db.config.put({
        clave: 'tasa',
        valor: tasaNumero, // Guardar como número
        fechaActualizacion: new Date(),
        tipo: 'decimal'
      });

      console.log('Tasa guardada:', tasaNumero);
      return true;

    } catch (error) {
      console.error('Error guardando tasa:', error);
      return false;
    }
  };

  return {
    tasa,
    setTasa,
    saveTasa,
    loading
  };
}