// src/components/Panel/hooks/useProductos.js
import { useState } from 'react';
import productosData from '../../../data/data.json';
import { db } from '../../../lib/db/database.js'; // Import normal

export function useProductos() {
  const [error, setError] = useState(null);

const importarProductos = async () => {
  try {
    // 1. CONVERTIR {clave:valor} a [{nombre, precio}]
    // Object.entries devuelve [id, objetoProducto]
    const productosArray = Object.entries(productosData).map(([id, producto]) => ({
      id: id,
      nombre: producto.nombre,      // Acceder a las propiedades del objeto producto
      grupo: producto.grupo,
      stock: producto.stock,
      imagen: producto.imagen,
      createdAt: producto.createdAt
    }));

    // 2. LIMPIAR TABLA
    await db.productos.clear();

    // 3. INSERTAR NUEVOS DATOS
    await db.productos.bulkAdd(productosArray);

    return {
      success: true,
      count: productosArray.length,
      total: productosArray.length,
      message: 'Productos importados correctamente.'
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