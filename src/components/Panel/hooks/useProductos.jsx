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
      '¿Estás seguro de realizar la carga inicial de datos?\n\n' +
      'Esta acción borrará todos los prod. existentes y cargará el data.json.'
    );
    
    if (!confirmar) {
      console.log('Carga de datos cancelada por el usuario');
      return { cancelled: true };
    }

    setLoading(true);
    setError(null);

    try {
      // 2. Importar
      const resultado = await Importer.ImportProductos(productosData);
      console.log('Resultado importación:', resultado);
      
      // 3. Retornar resultado
      if (resultado.success) {
        return { 
          success: true, 
          count: resultado.count,
          message: `${resultado.count} productos importados`
        };
      } else {
        setError(resultado.error);
        return { 
          success: false, 
          error: resultado.error 
        };
      }
      
    } catch (err) {
      setError(err.message);
      console.error('Error en importación:', err);
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
        data: productos,
        count: productos.length,
        message: `${productos.length} productos encontrados`
      };
    } catch (err) {
      console.error('Error verificando grupos:', err);
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
    error,
    clearError: () => setError(null)
  };
}