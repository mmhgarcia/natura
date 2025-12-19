// src/components/Panel/hooks/useProductos.js
import { useState } from 'react';
import productosData from '../../../data/data.json';
//import Importer from '../../../lib/db/utils/Importer.js';

  export function useProductos() {

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const importDataProductos = async () =>{
    try {
      // ¡CORRECCIÓN! - jsonData ya es el array de productos
      // No necesitas Object.entries, ya viene como array
      //const productosArray = jsonData.productos || jsonData;

      console.log('Productos a importar:', productosData.length);
      console.log('Primer producto:', productosData[0]);

      // 1. LIMPIAR TABLA
      await db.TBPRODUCTOS.clear();

      // 2. INSERTAR NUEVOS DATOS UNO POR UNO
      let importados = 0;
      for (const producto of productosData) {
        try {
          await db.productos.add({
              id: producto.id,
              nombre: producto.nombre,
              grupo: producto.grupo,
              stock: Number(producto.stock),
              imagen: producto.imagen,
              createdAt: new Date() // Agregar timestamp
          });
          importados++;
        } catch (error) {
          console.error(`Error insertando producto ${producto.id}:`, error);
        }
      }
    
      return {
        success: true,
        count: importados,
        total: productosData.length,
        message: `${importados} de ${productosData.length} productos importados`
      };
    
    } catch (error) {

      console.error('Error en importación de productos:', error);
      
      return {
        success: false,
        error: error.message
      };

    }
  }

  const importarProductos = async () => {
    
    // 1. Confirmación
    const confirmar = window.confirm(
      '¿Importar productos?\n\n' +
      'Se borrarán los productos existentes.\n'
    );
    
    if (!confirmar) {
      return { cancelled: true };
    }

    setLoading(true);
    setError(null);

    try {
      // 2. Importar (pasa SOLO el array de productos)
      const resultado = await importDataProductos();
      
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
      const productos = await db.TBPRODUCTOS.toArray();
      
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