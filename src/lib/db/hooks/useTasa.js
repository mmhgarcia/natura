// src/lib/db/hooks/useTasa.js
import { useState, useEffect, useCallback } from 'react';
import tasaRepository from '../repositories/TasaRepository.js';

export function useTasa() {
  const [tasas, setTasas] = useState([]);
  const [tasaActiva, setTasaActiva] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [stats, setStats] = useState(null);

  // Cargar todas las tasas
  const loadTasas = useCallback(async () => {
    try {
      setLoading(true);
      const [tasasData, tasaActivaData, statsData] = await Promise.all([
        tasaRepository.getAll(),
        tasaRepository.getActive(),
        tasaRepository.getStats()
      ]);
      
      setTasas(tasasData);
      setTasaActiva(tasaActivaData);
      setStats(statsData);
      setError(null);
    } catch (err) {
      setError(err.message || 'Error al cargar tasas');
      console.error('Error en loadTasas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar historial de una tasa
  const loadHistorial = useCallback(async (tasaId) => {
    try {
      const historialData = await tasaRepository.getHistorial(tasaId);
      setHistorial(historialData);
    } catch (err) {
      setError(err.message || 'Error al cargar historial');
    }
  }, []);

  // Crear nueva tasa
  const crearTasa = useCallback(async (tasaData) => {
    try {
      const id = await tasaRepository.create(tasaData);
      await loadTasas(); // Refrescar lista
      return { success: true, id };
    } catch (err) {
      const errorMsg = err.message || 'Error al crear tasa';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, [loadTasas]);

  // Actualizar tasa
  const actualizarTasa = useCallback(async (id, updates) => {
    try {
      await tasaRepository.update(id, updates);
      await loadTasas(); // Refrescar lista
      return { success: true };
    } catch (err) {
      const errorMsg = err.message || 'Error al actualizar tasa';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, [loadTasas]);

  // Eliminar tasa (soft delete)
  const eliminarTasa = useCallback(async (id) => {
    try {
      await tasaRepository.delete(id);
      await loadTasas(); // Refrescar lista
      return { success: true };
    } catch (err) {
      const errorMsg = err.message || 'Error al eliminar tasa';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, [loadTasas]);

  // Buscar tasas
  const buscarTasas = useCallback(async (query) => {
    try {
      setLoading(true);
      const resultados = await tasaRepository.search(query);
      setTasas(resultados);
      setError(null);
    } catch (err) {
      setError(err.message || 'Error en búsqueda');
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar datos al inicio
  useEffect(() => {
    loadTasas();
  }, [loadTasas]);

  return {
    // Datos
    tasas,
    tasaActiva,
    historial,
    stats,
    
    // Estados
    loading,
    error,
    
    // Acciones CRUD
    crearTasa,
    actualizarTasa,
    eliminarTasa,
    buscarTasas,
    loadHistorial,
    
    // Utilidades
    refresh: loadTasas,
    resetError: () => setError(null),
    resetHistorial: () => setHistorial([])
  };
  
}
