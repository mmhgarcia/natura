// src/components/Panel/hooks/useProductos.js
import { useState } from 'react';
import productosData from '../../../data/data.json';
import { db } from '../../../lib/db/database.js'; // Import normal

export function useProductos() {
  const [error, setError] = useState(null);

  const importarProductos = async () => {
    
    try {

      // 1. CONVERTIR {clave:valor} a [{nombre, precio}]
      const productosArray = Object.entries(productosData).map(([id, nombre, grupo, stock, imagen, createdAt]) => ({
        id: id,
        nombre: nombre,
        grupo: grupo,
        stock: stock,
        imagen: imagen,
        createdAt: createdAt
      }));
  
      // 2. LIMPIAR TABLA
      await db.productos.clear();
 
      // 3. INSERTAR NUEVOS DATOS
      await db.productos.bulkAdd(productosArray);
  

      return {
        success: true,
        count: productosArray.length,
        total: productosArray.length,
        message: 'Productos importados.'
      };

    } catch (error) {
      console.error('Error en importación de productos:', error);
      return {
        success: false,
        error: error.message
      };
    }
  };

  const ximportarProductos = async () => {
    const confirmar = window.confirm(
      '¿Importar productos?\n\nSe borrarán los productos existentes.\n'
    );

    if (!confirmar) {
      return { cancelled: true };
    }

    setError(null);

    try {
      // Inicializar DB si no está inicializada
      if (!db.db.isOpen()) {
        await db.init();
      }

      const resultado = await importDataProductos();
      console.log('Resultado:', resultado);
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
  };

  return {
    importarProductos,
    verificarProductos,
    error
  };
}