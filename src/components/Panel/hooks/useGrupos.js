// src/components/Panel/hooks/useGrupos.js
import { useState } from 'react';
import gruposData from '../../../data/grupos.json';
import { db } from '../../../lib/db/database.js'; 

export function useGrupos() {
  
  const [error, setError] = useState(null);

  const importarGrupos = async () => { 
          
    try {
              
      // 1. CONVERTIR {clave:valor} a [{nombre, precio}]
      const gruposArray = Object.entries(gruposData).map(([nombre, precio]) => ({
        nombre: nombre,
        precio: Number(precio)
      }));
  
      // 2. LIMPIAR TABLA
      await db.grupos.clear();
 
      // 3. INSERTAR NUEVOS DATOS
      await db.grupos.bulkAdd(gruposArray);
  
      return {
        success: true,
        count: gruposArray.length,
        message: `${gruposArray.length} grupos importados`
      };
  
    } catch (error) {
      console.error('Error en importación:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  

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
    error,
    clearError: () => setError(null)
  };
}