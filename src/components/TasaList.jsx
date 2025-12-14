// src/components/TasaList.jsx
import React, { useState } from 'react';
import { useTasa } from '../lib/db/hooks/useTasa.js';

const TasaList = () => {
  const { 
    tasas, 
    tasaActiva, 
    loading, 
    error, 
    eliminarTasa, 
    loadHistorial,
    historial,
    stats 
  } = useTasa();
  
  const [busqueda, setBusqueda] = useState('');
  const [tasaSeleccionada, setTasaSeleccionada] = useState(null);

  const handleEliminar = async (id) => {
    if (window.confirm('¿Estás seguro de desactivar esta tasa?')) {
      const result = await eliminarTasa(id);
      if (result.success) {
        alert('Tasa desactivada');
      } else {
        alert(`Error: ${result.error}`);
      }
    }
  };

  const handleVerHistorial = async (tasa) => {
    setTasaSeleccionada(tasa);
    await loadHistorial(tasa.id);
  };

  if (loading && tasas.length === 0) {
    return (
      <div className="p-4 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-2">Cargando tasas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded">
            <p className="text-sm text-gray-600">Total Tasas</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="p-4 bg-green-50 rounded">
            <p className="text-sm text-gray-600">Activas</p>
            <p className="text-2xl font-bold">{stats.activas}</p>
          </div>
          <div className="p-4 bg-yellow-50 rounded">
            <p className="text-sm text-gray-600">Promedio</p>
            <p className="text-2xl font-bold">{stats.promedio.toFixed(4)}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded">
            <p className="text-sm text-gray-600">Rango</p>
            <p className="text-lg font-bold">
              {stats.minima.toFixed(4)} - {stats.maxima.toFixed(4)}
            </p>
          </div>
        </div>
      )}

      {/* Tasa Activa */}
      {tasaActiva && (
        <div className="p-4 bg-green-50 border border-green-200 rounded">
          <h3 className="font-bold text-green-800 mb-2">⭐ Tasa Activa Actual</h3>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-lg font-semibold">{tasaActiva.nombre}</p>
              <p className="text-2xl font-bold">{tasaActiva.valor} {tasaActiva.moneda}</p>
            </div>
            <button
              onClick={() => handleVerHistorial(tasaActiva)}
              className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
            >
              Ver Historial
            </button>
          </div>
        </div>
      )}

      {/* Buscador */}
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar tasas..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full p-2 pl-10 border rounded"
        />
        <span className="absolute left-3 top-2.5">🔍</span>
      </div>

      {/* Lista de Tasas */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">
          Todas las Tasas ({tasas.length})
        </h3>
        
        {tasas.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No hay tasas registradas
          </p>
        ) : (
          tasas.map(tasa => (
            <div 
              key={tasa.id} 
              className={`p-4 border rounded flex justify-between items-center ${
                !tasa.activo ? 'bg-gray-50 opacity-75' : ''
              }`}
            >
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium">{tasa.nombre}</h4>
                  {!tasa.activo && (
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded">INACTIVA</span>
                  )}
                  {tasa.id === tasaActiva?.id && (
                    <span className="text-xs bg-green-200 px-2 py-1 rounded">ACTUAL</span>
                  )}
                </div>
                <p className="text-2xl font-bold my-1">{tasa.valor} {tasa.moneda}</p>
                {tasa.descripcion && (
                  <p className="text-sm text-gray-600">{tasa.descripcion}</p>
                )}
                <p className="text-xs text-gray-500">
                  Creada: {new Date(tasa.fechaCreacion).toLocaleDateString()}
                </p>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handleVerHistorial(tasa)}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  Historial
                </button>
                <button
                  onClick={() => handleEliminar(tasa.id)}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  {tasa.activo ? 'Desactivar' : 'Eliminar'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Historial */}
      {tasaSeleccionada && historial.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold">
                Historial: {tasaSeleccionada.nombre}
              </h3>
              <button
                onClick={() => setTasaSeleccionada(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4">
              <div className="space-y-3">
                {historial.map((item, index) => (
                  <div key={index} className="p-3 border rounded">
                    <div className="flex justify-between">
                      <span className="font-medium">{item.tipo}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(item.fechaCambio).toLocaleString()}
                      </span>
                    </div>
                    {item.valorAnterior !== null && (
                      <div className="mt-2 text-sm">
                        <span className="text-gray-600">De: </span>
                        <span className="line-through">{item.valorAnterior}</span>
                        <span className="mx-2">→</span>
                        <span className="text-green-600 font-semibold">{item.valorNuevo}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasaList;