// src/lib/db/database.js
import Dexie from 'dexie';

class AppDatabase extends Dexie {

  constructor() {

    super('TasaAppDB');
    
    // Versión 1: Tabla tasas
    this.version(1).stores({
      tasas: '++id, nombre, valor, fechaCreacion, fechaActualizacion, activo'
    });
    
    // Versión 2: Añadir historial de cambios
    this.version(2).stores({
      tasas: '++id, nombre, valor, fechaCreacion, fechaActualizacion, activo',
      historialTasas: '++id, tasaId, valorAnterior, valorNuevo, fechaCambio'
    }).upgrade(trans => {
      // Migración si necesitas copiar datos
    });
    
    // Vincular tablas
    this.tasas = this.table('tasas');
    this.historialTasas = this.table('historialTasas');
  }
}

// Crear y exportar instancia única
const db = new AppDatabase();

export default db;
