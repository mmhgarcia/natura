// src/lib/db/utils/Importer.js
// utilitario paraimportar datos (json) a Indexeddb
//
// Los ficheros importables estan en: /src/data

// Importo repositorios
//import GruposRepository from "../repositories/GruposRepository.js";
// import ProductosRepository from "../repositories/ProductosRepository.js";

import db from '../database.js';

const Importer = {
 
    async ImportGrupos(gruposData) {
        try {
            const gruposArray = Object.entries(gruposData)
            .map(([nombre, precio]) => ({ nombre, precio: Number(precio) }));

            await db.grupos.clear();
            await db.grupos.bulkAdd(gruposArray);

            return { success: true, count: gruposArray.length };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /*
    ImportProductos() {
        // Lógica para importar productos
        return { success: true, message: 'Productos importados' };
    }
    */

};

export default Importer;

// Entonces importarías así:
// import Importer from '../lib/db/utils/Importer.js';
// y lo usarías asi: Importer.ImportGrupos(), Importer.ImportProductos()
