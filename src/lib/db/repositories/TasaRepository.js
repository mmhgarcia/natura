// src/lib/db/repositories/TasaRepository.js
import db from '../database.js';

class TasaRepository {
  // CREATE - Crear nueva tasa
  async create(tasaData) {
    const now = new Date();
    const tasa = {
      nombre: tasaData.nombre || 'Tasa General',
      valor: parseFloat(tasaData.valor) || 0,
      descripcion: tasaData.descripcion || '',
      moneda: tasaData.moneda || 'USD',
      activo: tasaData.activo !== undefined ? tasaData.activo : true,
      fechaCreacion: now,
      fechaActualizacion: now,
      usuarioCreacion: tasaData.usuario || 'sistema'
    };
    
    const id = await db.tasas.add(tasa);
    
    // Registrar en historial
    await this.registrarEnHistorial(id, null, tasa.valor, 'CREACION');
    
    return id;
  }

  // READ ALL - Obtener todas las tasas
  async getAll(activo = true) {
    if (activo) {
      return db.tasas.where('activo').equals(true).toArray();
    }
    return db.tasas.toArray();
  }

  // READ BY ID - Obtener tasa por ID
  async getById(id) {
    return db.tasas.get(id);
  }

  // READ ACTIVE - Obtener tasa activa principal
  async getActive() {
    return db.tasas.where('activo').equals(true).first();
  }

  // UPDATE - Actualizar tasa
  async update(id, updates) {
    // Obtener valor anterior para historial
    const tasaAnterior = await db.tasas.get(id);
    
    if (!tasaAnterior) {
      throw new Error(`Tasa con ID ${id} no encontrada`);
    }
    
    const cambios = {
      ...updates,
      fechaActualizacion: new Date()
    };
    
    // Si cambia el valor, registrar en historial
    if (updates.valor !== undefined && updates.valor !== tasaAnterior.valor) {
      await this.registrarEnHistorial(
        id, 
        tasaAnterior.valor, 
        updates.valor,
        'ACTUALIZACION'
      );
    }
    
    return db.tasas.update(id, cambios);
  }

  // DELETE (soft) - Desactivar tasa
  async delete(id) {
    return db.tasas.update(id, { 
      activo: false,
      fechaActualizacion: new Date()
    });
  }

  // DELETE (hard) - Eliminar permanentemente
  async deletePermanently(id) {
    // Eliminar también el historial asociado
    await db.historialTasas.where('tasaId').equals(id).delete();
    return db.tasas.delete(id);
  }

  // HISTORIAL - Registrar cambio
  async registrarEnHistorial(tasaId, valorAnterior, valorNuevo, tipo) {
    return db.historialTasas.add({
      tasaId,
      valorAnterior,
      valorNuevo,
      tipo,
      fechaCambio: new Date(),
      usuario: 'sistema' // En una app real, sería el usuario actual
    });
  }

  // HISTORIAL - Obtener historial de una tasa
  async getHistorial(tasaId) {
    return db.historialTasas
      .where('tasaId')
      .equals(tasaId)
      .reverse()
      .toArray();
  }

  // SEARCH - Buscar tasas
  async search(query) {
    return db.tasas
      .filter(tasa => 
        tasa.nombre.toLowerCase().includes(query.toLowerCase()) ||
        tasa.descripcion.toLowerCase().includes(query.toLowerCase())
      )
      .toArray();
  }

  // BULK - Importar múltiples tasas
  async bulkImport(tasasArray, options = {}) {
    const { clearBeforeImport = false } = options;
    
    return db.transaction('rw', db.tasas, async () => {
      if (clearBeforeImport) {
        await db.tasas.clear();
      }
      
      const tasasTransformadas = tasasArray.map(tasa => ({
        ...tasa,
        valor: parseFloat(tasa.valor),
        activo: tasa.activo !== undefined ? tasa.activo : true,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date()
      }));
      
      await db.tasas.bulkAdd(tasasTransformadas);
      return tasasTransformadas.length;
    });
  }

  // STATS - Estadísticas
  async getStats() {
    const todasTasas = await db.tasas.toArray();
    const tasasActivas = todasTasas.filter(t => t.activo);
    
    return {
      total: todasTasas.length,
      activas: tasasActivas.length,
      promedio: tasasActivas.length > 0 
        ? tasasActivas.reduce((sum, t) => sum + t.valor, 0) / tasasActivas.length 
        : 0,
      maxima: tasasActivas.length > 0 
        ? Math.max(...tasasActivas.map(t => t.valor))
        : 0,
      minima: tasasActivas.length > 0 
        ? Math.min(...tasasActivas.map(t => t.valor))
        : 0
    };
  }
}

// Exportar instancia única
const tasaRepository = new TasaRepository();

export default tasaRepository;

