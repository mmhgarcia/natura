// src/components/TasaForm.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../lib/db/database'; // Ajusta la ruta según tu estructura

const TasaForm = () => {
  const [formData, setFormData] = useState({
    valor: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Cargar tasa existente al montar el componente
  useEffect(() => {
    cargarTasa();
  }, []);

  const cargarTasa = async () => {
    setLoading(true);
    try {
      // Buscar la tasa en la tabla config con clave 'tasa'
      const tasa = await db.get('config', 'tasa');
      if (tasa) {
        setFormData({ valor: tasa.valor.toString() });
      }
      setMessage({ type: '', text: '' });
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: 'Error al cargar la tasa: ' + err.message 
      });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { value } = e.target;
    // Permitir números con decimales
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setFormData({ valor: value });
      setMessage({ type: '', text: '' }); // Limpiar mensaje al cambiar
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación básica
    if (!formData.valor.trim()) {
      setMessage({ 
        type: 'error', 
        text: 'El valor de la tasa es requerido' 
      });
      return;
    }

    const valorNumero = parseFloat(formData.valor);
    if (isNaN(valorNumero) || valorNumero <= 0) {
      setMessage({ 
        type: 'error', 
        text: 'La tasa debe ser un número positivo' 
      });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      // Guardar en IndexedDB - tabla config, clave 'tasa'
      await db.put('config', {
        clave: 'tasa',
        valor: valorNumero,
        updatedAt: new Date().toISOString()
      });

      setMessage({ 
        type: 'success', 
        text: `Tasa guardada exitosamente: ${valorNumero.toFixed(4)}` 
      });
      
      // Opcional: Recargar después de guardar
      setTimeout(() => cargarTasa(), 500);
      
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: 'Error al guardar la tasa: ' + err.message 
      });
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleLimpiar = () => {
    setFormData({ valor: '' });
    setMessage({ type: '', text: '' });
  };

  // Estilos en línea para simplicidad
  const styles = {
    container: {
      maxWidth: '500px',
      margin: '0 auto',
      padding: '20px'
    },
    form: {
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '20px',
      backgroundColor: 'white'
    },
    title: {
      fontSize: '20px',
      fontWeight: '600',
      marginBottom: '20px',
      color: '#1f2937'
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '500',
      marginBottom: '8px',
      color: '#374151'
    },
    input: {
      width: '100%',
      padding: '10px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '16px',
      boxSizing: 'border-box'
    },
    buttonContainer: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '12px',
      marginTop: '20px'
    },
    button: {
      padding: '10px 20px',
      border: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    },
    buttonLimpiar: {
      backgroundColor: '#f3f4f6',
      color: '#374151',
      border: '1px solid #d1d5db'
    },
    buttonGuardar: {
      backgroundColor: '#3b82f6',
      color: 'white'
    },
    buttonDisabled: {
      backgroundColor: '#9ca3af',
      cursor: 'not-allowed'
    },
    message: {
      padding: '12px',
      borderRadius: '6px',
      marginBottom: '20px',
      fontSize: '14px'
    },
    messageSuccess: {
      backgroundColor: '#d1fae5',
      color: '#065f46',
      border: '1px solid #a7f3d0'
    },
    messageError: {
      backgroundColor: '#fee',
      color: '#991b1b',
      border: '1px solid #fecaca'
    },
    loading: {
      textAlign: 'center',
      padding: '20px',
      color: '#6b7280'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Cargando tasa...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2 style={styles.title}>
          Configurar Tasa de Cambio
        </h2>
        
        {/* Mensajes de estado */}
        {message.text && (
          <div style={{
            ...styles.message,
            ...(message.type === 'success' ? styles.messageSuccess : styles.messageError)
          }}>
            {message.text}
          </div>
        )}
        
        {/* Campo del valor */}
        <div>
          <label style={styles.label}>
            Valor de la Tasa *
          </label>
          <input
            type="text"
            name="valor"
            value={formData.valor}
            onChange={handleChange}
            required
            style={styles.input}
            placeholder="Ej: 36.50"
            disabled={saving}
          />
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
            Ingrese el valor numérico de la tasa (ej: 36.50 para tasa de cambio)
          </div>
        </div>
        
        {/* Botones */}
        <div style={styles.buttonContainer}>
          <button
            type="button"
            onClick={handleLimpiar}
            style={{
              ...styles.button,
              ...styles.buttonLimpiar,
              opacity: saving ? 0.5 : 1
            }}
            disabled={saving}
          >
            Limpiar
          </button>
          
          <button
            type="submit"
            style={{
              ...styles.button,
              ...styles.buttonGuardar,
              ...(saving ? styles.buttonDisabled : {}),
              opacity: saving ? 0.7 : 1
            }}
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar Tasa'}
          </button>
        </div>
      </form>
      
      {/* Información adicional */}
      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: '#f9fafb', 
        borderRadius: '6px',
        fontSize: '13px',
        color: '#6b7280'
      }}>
        <div style={{ fontWeight: '500', marginBottom: '5px' }}>
          💡 Información:
        </div>
        <div>• La tasa se guarda en IndexedDB (tabla: config, clave: tasa)</div>
        <div>• Puedes recuperarla en cualquier momento con: <code>db.get('config', 'tasa')</code></div>
        <div>• Formato almacenado: número decimal (ej: 36.5)</div>
      </div>
    </div>
  );
};

export default TasaForm;