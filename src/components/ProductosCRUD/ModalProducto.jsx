// src/components/ProductosCRUD/ModalProducto.jsx (VERSIÓN FINAL CORREGIDA)
import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db/database';

const ModalProducto = ({ producto, grupos, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    id: '',
    nombre: '',
    grupo: '',
    stock: 0,
    imagen: ''
  });
  const [error, setError] = useState('');
  const [validando, setValidando] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  // Inicializar formulario
  useEffect(() => {
    if (producto) {
      setFormData({
        id: producto.id.toString(),
        nombre: producto.nombre || '',
        grupo: producto.grupo || '',
        stock: producto.stock || 0,
        imagen: producto.imagen || ''
      });
    } else {
      // Valores por defecto para nuevo producto
      setFormData({ 
        id: '', 
        nombre: '', 
        grupo: grupos.length > 0 ? grupos[0].nombre : '', 
        stock: 0, 
        imagen: '' 
      });
    }
    setPreviewError(false);
  }, [producto, grupos]);

  // Validar si un ID ya existe
  const validarIdExistente = async (id) => {
    try {
      const existe = await db.get('productos', parseInt(id));
      return !!existe;
    } catch (err) {
      console.error('Error validando ID:', err);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setValidando(true);

    // Validaciones
    if (!formData.id.trim()) {
      setError('El ID es requerido');
      setValidando(false);
      return;
    }

    const idNumero = parseInt(formData.id);
    if (isNaN(idNumero) || idNumero <= 0) {
      setError('El ID debe ser un número positivo');
      setValidando(false);
      return;
    }

    if (!formData.nombre.trim()) {
      setError('El nombre es requerido');
      setValidando(false);
      return;
    }

    if (!formData.grupo) {
      setError('Debe seleccionar un grupo');
      setValidando(false);
      return;
    }

    if (formData.stock < 0) {
      setError('El stock no puede ser negativo');
      setValidando(false);
      return;
    }

    try {
      const dataToSave = {
        id: idNumero,
        nombre: formData.nombre,
        grupo: formData.grupo,
        stock: parseInt(formData.stock),
        imagen: formData.imagen,
        createdAt: producto ? producto.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Validar ID único
      if (producto) {
        const idCambiado = idNumero !== producto.id;
        
        if (idCambiado) {
          const idExiste = await validarIdExistente(idNumero);
          if (idExiste) {
            setError(`El ID ${idNumero} ya está en uso por otro producto`);
            setValidando(false);
            return;
          }

          await db.del('productos', producto.id);
          await db.add('productos', dataToSave);
        } else {
          await db.put('productos', dataToSave);
        }
      } else {
        const idExiste = await validarIdExistente(idNumero);
        if (idExiste) {
          setError(`El ID ${idNumero} ya está en uso`);
          setValidando(false);
          return;
        }

        await db.add('productos', dataToSave);
      }

      onSave();
      onClose();
    } catch (err) {
      setError('Error al guardar: ' + err.message);
      console.error(err);
    } finally {
      setValidando(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'stock' || name === 'id' ? 
              (value === '' ? '' : value.replace(/\D/g, '')) : 
              value
    }));
    if (name === 'imagen') {
      setPreviewError(false);
    }
  };

  const handleImageError = () => {
    setPreviewError(true);
  };

  // Funciones para estilos condicionales
  const getInputStyle = (disabled) => ({
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box',
    backgroundColor: disabled ? '#f5f5f5' : 'white',
    cursor: disabled ? 'not-allowed' : 'text'
  });

  const getSelectStyle = (disabled) => ({
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    backgroundColor: disabled ? '#f5f5f5' : 'white',
    cursor: disabled ? 'not-allowed' : 'pointer'
  });

  const getButtonStyle = (disabled, isCancel = false) => ({
    padding: '10px 20px',
    backgroundColor: disabled ? 
      (isCancel ? '#f5f5f5' : '#cccccc') : 
      (isCancel ? '#f5f5f5' : '#4CAF50'),
    color: isCancel ? '#333' : 'white',
    border: isCancel ? '1px solid #ddd' : 'none',
    borderRadius: '4px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '14px',
    fontWeight: isCancel ? 'normal' : '500',
    opacity: disabled ? 0.5 : 1
  });

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>
            {producto ? 'Editar Producto' : 'Nuevo Producto'}
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

            <div style={styles.row}>
              <div style={styles.formGroup}>
                <label htmlFor="id" style={styles.label}>
                  ID *
                </label>
                <input
                  type="text"
                  id="id"
                  name="id"
                  value={formData.id}
                  onChange={handleChange}
                  style={getInputStyle(validando)}
                  placeholder="Ej: 1, 2, 3..."
                  autoFocus
                  disabled={validando}
                />
              </div>

              <div style={styles.formGroup}>
                <label htmlFor="stock" style={styles.label}>
                  Stock
                </label>
                <input
                  type="number"
                  id="stock"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  style={getInputStyle(validando)}
                  min="0"
                  placeholder="0"
                  disabled={validando}
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="nombre" style={styles.label}>
                Nombre del Producto *
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                style={getInputStyle(validando)}
                placeholder="Ej: Parchita Cremosa, Pina Cremosa, etc."
                disabled={validando}
              />
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="grupo" style={styles.label}>
                Grupo *
              </label>
              <select
                id="grupo"
                name="grupo"
                value={formData.grupo}
                onChange={handleChange}
                style={getSelectStyle(validando || grupos.length === 0)}
                disabled={validando || grupos.length === 0}
              >
                <option value="">Seleccionar grupo...</option>
                {grupos.map(grupo => (
                  <option key={grupo.id} value={grupo.nombre}>
                    {grupo.nombre} (${grupo.precio.toFixed(2)})
                  </option>
                ))}
              </select>
              {grupos.length === 0 && (
                <div style={styles.warning}>
                  No hay grupos disponibles. Crea primero un grupo.
                </div>
              )}
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="imagen" style={styles.label}>
                URL de la Imagen (opcional)
              </label>
              <input
                type="text"
                id="imagen"
                name="imagen"
                value={formData.imagen}
                onChange={handleChange}
                style={getInputStyle(validando)}
                placeholder="Ej: /images/producto.jpg"
                disabled={validando}
              />
              {formData.imagen && (
                <div style={styles.imagenPreview}>
                  <span>Vista previa:</span>
                  {!previewError ? (
                    <img 
                      src={formData.imagen} 
                      alt="Vista previa" 
                      style={styles.previewImg}
                      onError={handleImageError}
                    />
                  ) : (
                    <div style={styles.previewError}>
                      No se puede cargar la imagen
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={styles.footer}>
            <button
              type="button"
              onClick={onClose}
              style={getButtonStyle(validando, true)}
              disabled={validando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={getButtonStyle(validando || grupos.length === 0, false)}
              disabled={validando || grupos.length === 0}
            >
              {validando ? 'Guardando...' : 
               producto ? 'Guardar Cambios' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Estilos base
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
    maxWidth: '600px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
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
    overflowY: 'auto',
    flex: 1
  },
  error: {
    backgroundColor: '#fee',
    color: '#c33',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '20px',
    fontSize: '14px'
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
    marginBottom: '15px'
  },
  formGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '500',
    color: '#333',
    fontSize: '14px'
  },
  warning: {
    backgroundColor: '#fff3cd',
    color: '#856404',
    padding: '8px',
    borderRadius: '4px',
    marginTop: '8px',
    fontSize: '13px',
    border: '1px solid #ffeaa7'
  },
  imagenPreview: {
    marginTop: '10px',
    fontSize: '13px',
    color: '#666'
  },
  previewImg: {
    maxWidth: '100%',
    maxHeight: '150px',
    marginTop: '8px',
    borderRadius: '4px',
    border: '1px solid #eee'
  },
  previewError: {
    backgroundColor: '#fee',
    color: '#c33',
    padding: '8px',
    borderRadius: '4px',
    marginTop: '8px',
    fontSize: '12px'
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    padding: '20px',
    borderTop: '1px solid #eee'
  }
};

// SOLO UN export default
export default ModalProducto;