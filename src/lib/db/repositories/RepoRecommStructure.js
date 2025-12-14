// Ejemplo de repositorio completo para Tasa
class TasaRepository {
  // === CRUD BÁSICO ===
  async create(data) { /* ... */ }
  async getById(id) { /* ... */ }
  async getAll() { /* ... */ }
  async update(id, data) { /* ... */ }
  async delete(id) { /* ... */ }
  
  // === CONSULTAS ESPECÍFICAS ===
  async getActivas() { /* ... */ }
  async getByMoneda(moneda) { /* ... */ }
  async getByRangoValor(min, max) { /* ... */ }
  
  // === BÚSQUEDAS ===
  async search(term) { /* ... */ }
  async getFiltradas(filtros) { /* ... */ }
  
  // === AGREGACIONES ===
  async getEstadisticas() { /* ... */ }
  async getConteoPorMoneda() { /* ... */ }
  
  // === VALIDACIONES ===
  async validarTasa(data) { /* ... */ }
  async existeTasaSimilar(data) { /* ... */ }
  
  // === OPERACIONES MASIVAS ===
  async bulkInsert(tasas) { /* ... */ }
  async bulkUpdate(ids, updates) { /* ... */ }
  
  // === HISTORIAL/AUDITORÍA ===
  async getHistorial(tasaId) { /* ... */ }
  async registrarCambio(tasaId, cambios) { /* ... */ }
  
  // === SINCRONIZACIÓN ===
  async getCambiosPendientes() { /* ... */ }
  async marcarComoSincronizado(id) { /* ... */ }
  
  // === UTILIDADES ===
  async hacerBackup() { /* ... */ }
  async compactar() { /* ... */ }
  async getInfo() { /* ... */ }
}