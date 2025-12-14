// src/components/TasaForm.jsx
import React, { useState } from 'react';

const TasaForm = ({ onSubmit, initialData = null, loading = false }) => {
  const [formData, setFormData] = useState({
    nombre: initialData?.nombre || '',
    valor: initialData?.valor || '',
    descripcion: initialData?.descripcion || '',
    moneda: initialData?.moneda || 'USD',
    activo: initialData?.activo !== undefined ? initialData.activo : true
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg">
      <h2 className="text-xl font-bold">
        {initialData ? 'Editar Tasa' : 'Nueva Tasa'}
      </h2>
      
      <div>
        <label className="block text-sm font-medium mb-1">
          Nombre *
        </label>
        <input
          type="text"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
          placeholder="Ej: Tasa de cambio USD/EUR"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Valor *
          </label>
          <input
            type="number"
            name="valor"
            value={formData.valor}
            onChange={handleChange}
            required
            step="0.0001"
            className="w-full p-2 border rounded"
            placeholder="0.00"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">
            Moneda
          </label>
          <select
            name="moneda"
            value={formData.moneda}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="JPY">JPY</option>
            <option value="MXN">MXN</option>
          </select>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">
          Descripción
        </label>
        <textarea
          name="descripcion"
          value={formData.descripcion}
          onChange={handleChange}
          rows="3"
          className="w-full p-2 border rounded"
          placeholder="Descripción de la tasa..."
        />
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          name="activo"
          id="activo"
          checked={formData.activo}
          onChange={handleChange}
          className="mr-2"
        />
        <label htmlFor="activo" className="text-sm">
          Tasa activa
        </label>
      </div>
      
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={() => setFormData({
            nombre: '',
            valor: '',
            descripcion: '',
            moneda: 'USD',
            activo: true
          })}
          className="px-4 py-2 border rounded hover:bg-gray-50"
        >
          Limpiar
        </button>
        
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
        >
          {loading ? 'Guardando...' : initialData ? 'Actualizar' : 'Crear Tasa'}
        </button>
      </div>
    </form>
  );
};

export default TasaForm;