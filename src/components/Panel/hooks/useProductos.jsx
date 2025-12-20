// src/components/Panel/hooks/useProductos.js
import { useState } from 'react';
import productosData from '../../../data/data.json';
import { db } from '../../../lib/db/database.js'; // Import normal

export function useProductos() {
  const [error, setError] = useState(null);

const importarProductos = async () => {
  try {
    // 1. OBTENER EL ARRAY DE PRODUCTOS
    // Accedemos a la propiedad "productos" del objeto
    const productosArray = productosData.productos;
    
    // Si necesitas asegurar que cada producto tenga un campo createdAt
    const productosConFecha = productosArray.map(producto => ({
      ...producto,
      createdAt: producto.createdAt || new Date().toISOString() // Fecha actual si no existe
    }));

    // 2. LIMPIAR TABLA
    await db.productos.clear();

    // 3. INSERTAR NUEVOS DATOS
    await db.productos.bulkAdd(productosConFecha);

    console.log(`Importando ${productosConFecha.length} productos...`);

    return {
      success: true,
      count: productosConFecha.length,
      total: productosConFecha.length,
      message: `${productosConFecha.length} productos importados exitosamente.`
    };

  } catch (error) {
    console.error('Error en importación de productos:', error);
    return {
      success: false,
      error: error.message
    };
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