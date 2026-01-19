// src/lib/db/database.js

import Dexie from 'dexie';
import 'dexie-export-import';

export class NaturaDBClass {
    constructor() {
        // La base de datos se mantiene como dbTasaBCV [4]
        this.db = new Dexie('dbTasaBCV');

        // Versión 1 - Esquema inicial [2]
        this.db.version(1).stores({
            productos: 'id, nombre, grupo, stock, imagen, createdAt',
            grupos: '++id, nombre, precio'
        });

        // Versión 2 - Agrega tabla config [2]
        this.db.version(2).stores({
            productos: 'id, nombre, grupo, stock, imagen, createdAt',
            grupos: '++id, nombre, precio',
            config: 'clave'
        });

        // Versión 3 - Agrega tabla ventas [3]
        this.db.version(3).stores({
            productos: 'id, nombre, grupo, stock, imagen, createdAt',
            grupos: '++id, nombre, precio',
            config: 'clave',
            ventas: '++id, productoId, nombre, grupo, precioUsd, fecha, cantidad'
        });

        // NUEVA Versión 4 - Agrega tabla pedidos con ID AUTONUMÉRICO
        // El prefijo '++' define el campo como autoincremental en Dexie [1].
        this.db.version(4).stores({
            productos: 'id, nombre, grupo, stock, imagen, createdAt',
            grupos: '++id, nombre, precio',
            config: 'clave',
            ventas: '++id, productoId, nombre, grupo, precioUsd, fecha, cantidad',
            pedidos: '++id, numero_pedido, fecha_pedido, tasa' 
        });

        // Referencias para acceso directo [5]
        this.productos = this.db.productos;
        this.grupos = this.db.grupos;
        this.config = this.db.config;
        this.ventas = this.db.ventas;
        this.pedidos = this.db.pedidos; // Referencia a la nueva tabla
    }

    // Métodos de inicialización [5]
    async init() {
        await this.db.open();
        console.log("db open.");
        return this;
    }

    // Métodos CRUD genéricos [5, 6]
    async add(table, data) {
        return await this.db[table].add(data);
    }

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

    async put(table, data) {
        return await this.db[table].put(data);
    }

    async del(table, id) {
        await this.db[table].delete(id);
    }

    // Métodos específicos del negocio [7]
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

// Exportar instancia global [7]
export const db = new NaturaDBClass();