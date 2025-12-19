// src/lib/db/database.js
import Dexie from 'dexie';

export class NaturaDBClass {

  constructor() {

    this.db = new Dexie('dbTasaBCV');
    
    this.TBGRUPOS = "grupos";
    this.TBPRODUCTOS = "productos";
    this.TBCONFIG = "config";
    
    // Versión con migraciones
    this.db.version(2).stores({
      productos: 'id, nombre, grupo, stock, imagen, createdAt',
      grupos: '++id, nombre, precio',
      config: 'clave'
    });

    this.db.version(1).stores({
      productos: 'id, nombre, grupo, stock, imagen, createdAt',
      grupos: '++id, nombre, precio'
    });

  }

  // Abrir db
  async init() {
    await this.db.open();
    console.log("db open.");
    return this;
  }

  // Métodos SimpleRepo compatibles
  async add(table, data) {
    return await this.db[table].add(data);
  }

  async getAll(table, filters = {}) {
    let query = this.db[table];
    for (const [key, value] of Object.entries(filters)) {
      query = query.where(key).equals(value);
    }
    return await query.toArray();
  }

  async getById(table, id) {
    return await this.db[table].get(id);
  }

  async put(table, data) {
    return await this.db[table].put(data);
  }

  async del(table, id) {
    await this.db[table].delete(id);
  }

  // Métodos adicionales específicos
  async getProductosByGrupo(grupoId) {
    return await this.db.productos.where('grupo').equals(grupoId).toArray();
  }

  async updateStock(productoId, cantidad) {
    const producto = await this.get('productos', productoId);
    if (producto) {
      const nuevoStock = Math.max(0, producto.stock + cantidad);
      return await this.put('productos', {
        ...producto,
        stock: nuevoStock
      });
    }
    return null;
  }

  async getConfigValue(clave) {
    const config = await this.get('config', clave);
    return config ? config.valor : null;
  }

  async setConfigValue(clave, valor) {
    return await this.put('config', {
      clave,
      valor,
      updatedAt: new Date()
    });
  }
}

// Exportar instancia global
export const db = new NaturaDBClass();

