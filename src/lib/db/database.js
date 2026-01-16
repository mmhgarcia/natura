// src/lib/db/database.js
import Dexie from 'dexie';

export class NaturaDBClass {
  constructor() {
    this.db = new Dexie('dbTasaBCV');
    
    // Versión 1 - Esquema inicial
    this.db.version(1).stores({
      productos: 'id, nombre, grupo, stock, imagen, createdAt',
      grupos: '++id, nombre, precio'
    });

    // Versión 2 - Agrega tabla config
    this.db.version(2).stores({
      productos: 'id, nombre, grupo, stock, imagen, createdAt',
      grupos: '++id, nombre, precio',
      config: 'clave'
    }).upgrade(trans => {
      // Migración: puedes inicializar datos aquí si es necesario
      console.log('Migrando a versión 2...');
    });

    // Version 3 - Adds sales table for statistics
    this.db.version(3).stores({
        productos: 'id, nombre, grupo, stock, imagen, createdAt',
        grupos: '++id, nombre, precio',
        config: 'clave',
        ventas: '++id, productoId, nombre, grupo, precioUsd, fecha, cantidad' // New table
    });

    // Referencias CORRECTAS usando this.db
    this.productos = this.db.productos;
    this.grupos = this.db.grupos;
    this.config = this.db.config;
    this.ventas = this.db.ventas;
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

  // FALTABA: método get() que se usa en updateStock()
  async get(table, id) {
    return await this.db[table].get(id);
  }

  async getAll(table, filters = {}) {
    let query = this.db[table];
    for (const [key, value] of Object.entries(filters)) {
      query = query.where(key).equals(value);
    }
    return await query.toArray();
  }

  // getById es redundante con get(), puedes eliminar uno
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
    // Ahora this.get() existe
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