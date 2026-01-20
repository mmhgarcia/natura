import Dexie from 'dexie';
import 'dexie-export-import'; // Required for database backup functionality [1, 4]

export class NaturaDBClass {
    constructor() {
        // The database is named dbTasaBCV as per project requirements [1, 5]
        this.db = new Dexie('dbTasaBCV');

        // Version 1 - Initial schema [1]
        this.db.version(1).stores({
            productos: 'id, nombre, grupo, stock, imagen, createdAt',
            grupos: '++id, nombre, precio'
        });

        // Version 2 - Added configuration table [2]
        this.db.version(2).stores({
            productos: 'id, nombre, grupo, stock, imagen, createdAt',
            grupos: '++id, nombre, precio',
            config: 'clave'
        });

        // Version 3 - Added sales table for real-time tracking [2]
        this.db.version(3).stores({
            productos: 'id, nombre, grupo, stock, imagen, createdAt',
            grupos: '++id, nombre, precio',
            config: 'clave',
            ventas: '++id, productoId, nombre, grupo, precioUsd, fecha, cantidad'
        });

        // Version 4 - Added orders table with autoincremental ID [3]
        this.db.version(4).stores({
            productos: 'id, nombre, grupo, stock, imagen, createdAt',
            grupos: '++id, nombre, precio',
            config: 'clave',
            ventas: '++id, productoId, nombre, grupo, precioUsd, fecha, cantidad',
            pedidos: '++id, numero_pedido, fecha_pedido, tasa'
        });

        // Version 5 - Added cost field (costo_$) to groups for price management [3]
        this.db.version(5).stores({
            productos: 'id, nombre, grupo, stock, imagen, createdAt',
            grupos: '++id, nombre, precio, costo_$', 
            config: 'clave',
            ventas: '++id, productoId, nombre, grupo, precioUsd, fecha, cantidad',
            pedidos: '++id, numero_pedido, fecha_pedido, tasa'
        });

        // NEW Version 6 - Added status field (estatus) to orders for workflow management
        // Note: 'items' and totals are stored in the object but not indexed [History]
        this.db.version(6).stores({
            productos: 'id, nombre, grupo, stock, imagen, createdAt',
            grupos: '++id, nombre, precio, costo_$',
            config: 'clave',
            ventas: '++id, productoId, nombre, grupo, precioUsd, fecha, cantidad',
            pedidos: '++id, numero_pedido, fecha_pedido, tasa, estatus'
        });

        // Direct access references for components [6]
        this.productos = this.db.productos;
        this.grupos = this.db.grupos;
        this.config = this.db.config;
        this.ventas = this.db.ventas;
        this.pedidos = this.db.pedidos;
    }

    // Initialisation method called by the app entry points [6]
    async init() {
        if (!this.db.isOpen()) {
            await this.db.open();
            console.log("Database dbTasaBCV opened successfully.");
        }
        return this;
    }

    // Generic CRUD methods used across the application [6, 7]
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

    // Business specific logic for inventory management [7, 8]
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

    // Configuration helpers for BCV rate and settings [8, 9]
    async getConfigValue(clave) {
        const config = await this.get('config', clave);
        return config ? config.valor : null;
    }

    async setConfigValue(clave, valor) {
        return await this.put('config', {
            clave,
            valor,
            updatedAt: new Date().toISOString()
        });
    }
}

export const db = new NaturaDBClass();