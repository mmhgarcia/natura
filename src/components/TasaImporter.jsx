// src/components/TasaImporter.jsx
import React, { useRef } from 'react';
import { useDataImport } from '../lib/db/hooks/useDataImport.js';
import tasaRepository from '../lib/db/repositories/TasaRepository.js';

const TasaImporter = ({ onImportComplete }) => {
  const fileInputRef = useRef(null);
  const { importing, result, importFromFile } = useDataImport();
  const [demoJson, setDemoJson] = useState('');

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await importFromFile(file);
    if (result.success && onImportComplete) {
      onImportComplete();
    }
  };

  const handleDemoImport = async () => {
    try {
      const tasasDemo = [
        {
          nombre: "Tasa de Cambio USD/EUR",
          valor: 0.92,
          moneda: "EUR",
          descripcion: "Tasa de cambio dólar a euro",
          activo: true
        },
        {
          nombre: "Tasa de Cambio USD/GBP",
          valor: 0.79,
          moneda: "GBP",
          descripcion: "Tasa de cambio dólar a libra",
          activo: true
        },
        {
          nombre: "Tasa de Interés Referencial",
          valor: 4.25,
          moneda: "USD",
          descripcion: "Tasa de interés anual",
          activo: true
        }
      ];

      const count = await tasaRepository.bulkImport(tasasDemo, { clearBeforeImport: false });
      
      if (onImportComplete) {
        onImportComplete();
      }
      
      alert(`✅ ${count} tasas de demostración importadas`);
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  const handleExport = async () => {
    try {
      const tasas = await tasaRepository.getAll(false);
      const dataStr = JSON.stringify(tasas, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `tasas_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
    } catch (error) {
      alert(`Error al exportar: ${error.message}`);
    }
  };

  return (
    <div className="p-4 border rounded-lg space-y-4">
      <h3 className="font-bold">Importar/Exportar Tasas</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Importar desde archivo */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            Importar desde JSON
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            disabled={importing}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        
        {/* Datos de demostración */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            Datos de demostración
          </label>
          <button
            onClick={handleDemoImport}
            disabled={importing}
            className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
          >
            Cargar Datos Demo
          </button>
        </div>
        
        {/* Exportar */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            Exportar datos
          </label>
          <button
            onClick={handleExport}
            className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Exportar JSON
          </button>
        </div>
      </div>
      
      {/* Resultado de importación */}
      {importing && (
        <div className="p-2 bg-blue-50 rounded text-center">
          <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
          Importando...
        </div>
      )}
      
      {result && (
        <div className={`p-3 rounded ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {result.success 
            ? `✅ ${result.count} tasas importadas exitosamente`
            : `❌ Error: ${result.error}`
          }
        </div>
      )}
    </div>
  );
};
export default TasaImporter;