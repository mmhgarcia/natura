// src/lib/db/database.js

import Dexie from "dexie";

const db = new Dexie("dbTasaBCV");

// Actualizar esquema para incluir tabla de configuración
db.version(2).stores({
  productos: 'id, nombre, grupo, stock, imagen, createdAt',
  grupos: '++id, nombre, precio',
  config: 'clave' // Clave primaria única
});

// Para migración desde versión 1
db.version(1).stores({
  productos: 'id, nombre, grupo, stock, imagen, createdAt',
  grupos: '++id, nombre, precio'
});

export { db };
