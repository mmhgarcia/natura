// src/lib/db/database.js

import Dexie from "dexie";

export const db = new Dexie("dbTasaBCV");

db.version(1).stores({

  tasa: 'id, nombre, valor',
  
  grupos: '++id, nombre, precio',

  productos: 'id, nombre, grupo, stock, imagen'

});


