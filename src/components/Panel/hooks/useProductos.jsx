// src/components/Panel/hooks/useProductos.js
import { useState } from 'react';
import productosData from '../../../data/data.json';
import { db } from '../../../lib/db/database.js'; // Import normal

export function useProductos() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const importDataProductos = async () => {
    try {
      console.log('Productos a importar:', productosData.length);
      console.log('Primer producto:', productosData[0]);

      // 1. INICIALIZAR BASE DE DATOS (IMPORTANTE)
      await db.init(); // Asegurar que la DB está abierta

      // 2. LIMPIAR TABLA - Usar la tabla Dexie correctamente
      await db.db.productos.clear(); // o await db.db[db.TBPRODUCTOS].clear()

      // 3. INSERTAR NUEVOS DATOS
      let importados = 0;
      for (const producto of productosData) {
        try {
          // Usar el método 'add' de tu clase
          await db.add('productos', {
            id: producto.id,
            nombre: producto.nombre,
            grupo: producto.grupo,
            stock: Number(producto.stock),
            imagen: producto.imagen,
            createdAt: new Date()
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
  };

  const importarProductos = async () => {
    const confirmar = window.confirm(
      '¿Importar productos?\n\nSe borrarán los productos existentes.\n'
    );

    if (!confirmar) {
      return { cancelled: true };
    }

    setLoading(true);
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
    try {
      // Asegurar DB inicializada
      if (!db.db.isOpen()) {
        await db.init();
      }

      // OPCIÓN A: Usar el método getAll de tu clase
      const productos = await db.getAll('productos');
      
      // OPCIÓN B: Acceder directamente a la tabla Dexie
      // const productos = await db.db.productos.toArray();

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