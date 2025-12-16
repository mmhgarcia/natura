// src/components/Panel/hooks/useGrupos.js
import { useState } from 'react';
import gruposData from '../../../data/grupos.json';
import Importer from '../../../lib/db/utils/Importer.js';

export function useGrupos() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const importarGrupos = async () => {
    
    // 1. Confirmación
    const confirmar = window.confirm(
      '¿Estás seguro de realizar la carga inicial de datos?\n\n' +
      'Esta acción borrará todos los grupos existentes y cargará los datos por defecto.'
    );
    
    if (!confirmar) {
      console.log('Carga de datos cancelada por el usuario');
      return { cancelled: true };
    }

    setLoading(true);
    setError(null);

    try {
      // 2. Importar
      const resultado = await Importer.ImportGrupos(gruposData);
      console.log('Resultado importación:', resultado);
      
      // 3. Retornar resultado
      if (resultado.success) {
        return { 
          success: true, 
          count: resultado.count,
          message: `${resultado.count} grupos importados`
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

  const verificarGrupos = async () => {
    try {
      const { db } = await import('../../../lib/db/database.js');
      const grupos = await db.grupos.toArray();
      
      return {
        success: true,
        data: grupos,
        count: grupos.length,
        message: `${grupos.length} grupos encontrados`
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
    importarGrupos,
    verificarGrupos,
    loading,
    error,
    clearError: () => setError(null)
  };
}