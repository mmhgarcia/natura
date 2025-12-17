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
            // 1. CONVERTIR {clave:valor} a [{nombre, precio, ...}]
            const prodArray = Object.entries(jsonData).map(([id, nombre, grupo, stock, imagen]) => ({
                id: id,
                nombre: nombre,
                grupo: grupo,
                stock: Number(stock),
                imagen: imagen
            }));

            // 2. LIMPIAR TABLA
            await db.productos.clear();

            // 3. INSERTAR NUEVOS DATOS
            await db.productos.bulkAdd(prodArray);

            return {
                success: true,
                count: prodArray.length,
                message: `${prodArray.length} items importados`
            };

        } catch (error) {
            console.error('Error en importación:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
};

export default Importer;