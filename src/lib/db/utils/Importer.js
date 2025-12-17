// src/lib/db/utils/Importer.js
import { db } from '../database.js';

const Importer = {
    async ImportGrupos(jsonData) {
        try {
            // 1. CONVERTIR {clave:valor} a [{nombre, precio}]
            const gruposArray = Object.entries(jsonData).map(([nombre, precio]) => ({
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
    },

    async ImportProductos(jsonData) {
        try {
            // ¡CORRECCIÓN! - jsonData ya es el array de productos
            // No necesitas Object.entries, ya viene como array
            const productosArray = jsonData.productos || jsonData;

            console.log('Productos a importar:', productosArray.length);
            console.log('Primer producto:', productosArray[0]);

            // 1. LIMPIAR TABLA
            await db.productos.clear();

            // 2. INSERTAR NUEVOS DATOS UNO POR UNO
            let importados = 0;
            for (const producto of productosArray) {
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
                total: productosArray.length,
                message: `${importados} de ${productosArray.length} productos importados`
            };

        } catch (error) {
            console.error('Error en importación de productos:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
};

export default Importer;