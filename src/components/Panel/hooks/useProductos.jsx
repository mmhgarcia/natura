// src/components/Panel/hooks/useProductos.js
import { useState } from 'react';
import productosData from '../../../data/data.json';
import Importer from '../../../lib/db/utils/Importer.js';

export function useProductos() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const importarProductos = async () => {
    
    // 1. Confirmación
    const confirmar = window.confirm(
      '¿Importar productos?\n\n' +
      'Se borrarán los productos existentes.\n' +
      'Se cargarán ' + productosData.productos.length + ' productos.'
    );
    
    if (!confirmar) {
      return { cancelled: true };
    }

    setLoading(true);
    setError(null);

    try {
      // 2. Importar (pasa SOLO el array de productos)
      const resultado = await Importer.ImportProductos(productosData);
      console.log('Resultado:', resultado);
      
      // 3. Retornar resultado simple
      return resultado;
      
    } catch (err) {
      console.error('Error:', err);
      return { 
        success: false, 
        error: err.message 
      };
    } finally {
      setLoading(false);
    }
  };

  const verificarProductos = async () => {
    try {
      const { db } = await import('../../../lib/db/database.js');
      const productos = await db.productos.toArray();
      
      return {
        success: true,
        count: productos.length,
        data: productos
      };
    } catch (err) {
      console.error('Error:', err);
      return {
        success: false,
        error: err.message,
        data: []
      };
    }
  };

  return {
    importarProductos,
    verificarProductos,
    loading,
    error
  };
}