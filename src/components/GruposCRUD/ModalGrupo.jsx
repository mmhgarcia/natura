// src/components/GruposCRUD/ModalGrupo.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db/database';

const ModalGrupo = ({ grupo, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    id: '',
    nombre: '',
    precio: 0
  });
  const [error, setError] = useState('');

  // Inicializar formulario cuando cambia el grupo
  useEffect(() => {
    if (grupo) {
      setFormData({
        nombre: grupo.nombre || '',
        precio: grupo.precio || 0
      });
    } else {
      setFormData({ nombre: '', precio: 0 });
    }
  }, [grupo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (!formData.nombre.trim()) {
      setError('El nombre es requerido');
      return;
    }

    if (formData.precio < 0) {
      setError('El precio no puede ser negativo');
      return;
    }

    try {
      // Guardar en la base de datos
      if (grupo) {
        // Editar grupo existente
        await db.put('grupos', {
          id: grupo.id,
          ...formData
        });
      } else {
        // Crear nuevo grupo
        await db.add('grupos', formData);
      }

      // Notificar al componente padre y cerrar
      onSave();
      onClose();
    } catch (err) {
      setError('Error al guardar: ' + err.message);
      console.error(err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'precio' ? parseFloat(value) || 0 : value
    }));
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>
            {grupo ? 'Editar Grupo' : 'Nuevo Grupo'}
          </h2>
          <button onClick={onClose} style={styles.closeButton}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.content}>
            {error && (
              <div style={styles.error}>
                {error}
              </div>
            )}

            <div style={styles.formGroup}>
              <label htmlFor="nombre" style={styles.label}>
                Nombre del Grupo *
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                style={styles.input}
                placeholder="Ej: Premium, Básico, etc."
                autoFocus
              />
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="precio" style={styles.label}>
                Precio ($)
              </label>
              <input
                type="number"
                id="precio"
                name="precio"
                value={formData.precio}
                onChange={handleChange}
                style={styles.input}
                step="0.01"
                min="0"
                placeholder="0.00"
              />
              <div style={styles.helpText}>
                Precio adicional para productos de este grupo
              </div>
            </div>
          </div>

          <div style={styles.footer}>
            <button
              type="button"
              onClick={onClose}
              style={styles.cancelButton}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={styles.saveButton}
            >
              {grupo ? 'Guardar Cambios' : 'Crear Grupo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Estilos en línea para simplicidad
const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '8px',
    width: '100%',
    maxWidth: '500px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid #eee'
  },
  title: {
    margin: 0,
    fontSize: '18px',
    color: '#333'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#666',
    padding: '0',
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  content: {
    padding: '20px',
    overflowY: 'auto'
  },
  error: {
    backgroundColor: '#fee',
    color: '#c33',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '15px',
    fontSize: '14px'
  },
  formGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '500',
    color: '#333'
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
    boxSizing: 'border-box'
  },
  helpText: {
    fontSize: '12px',
    color: '#666',
    marginTop: '5px'
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    padding: '20px',
    borderTop: '1px solid #eee'
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#f5f5f5',
    color: '#333',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  saveButton: {
    padding: '10px 20px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  }
};

export default ModalGrupo;