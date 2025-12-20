// src/components/ProductosCRUD/ModalProducto.jsx (VERSIÓN SIMPLIFICADA)
import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db/database';

const ModalProducto = ({ producto, grupos, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    id: '',
    nombre: '',
    grupo: '',
    stock: 0,
    imagen: '' // Mantenemos el campo pero sin mostrar vista previa
  });
  const [error, setError] = useState('');
  const [validando, setValidando] = useState(false);

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
  };

  return (
    <div style={{
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
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px',
          borderBottom: '1px solid #eee',
          backgroundColor: '#f8f9fa'
        }}>
          <h2 style={{ margin: 0, fontSize: '18px', color: '#333', fontWeight: '600' }}>
            {producto ? '✏️ Editar Producto' : '➕ Nuevo Producto'}
          </h2>
          <button 
            onClick={onClose} 
            style={{
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
              justifyContent: 'center',
              ':hover': {
                backgroundColor: '#e9ecef'
              }
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
            {error && (
              <div style={{
                backgroundColor: '#fee',
                color: '#c33',
                padding: '12px',
                borderRadius: '4px',
                marginBottom: '20px',
                fontSize: '14px',
                border: '1px solid #fcc'
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* Fila: ID y Stock */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '15px',
              marginBottom: '20px'
            }}>
              <div>
                <label htmlFor="id" style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: '#333',
                  fontSize: '14px'
                }}>
                  ID *
                </label>
                <input
                  type="text"
                  id="id"
                  name="id"
                  value={formData.id}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    backgroundColor: validando ? '#f8f9fa' : 'white',
                    cursor: validando ? 'not-allowed' : 'text'
                  }}
                  placeholder="Ej: 1, 2, 3..."
                  autoFocus
                  disabled={validando}
                />
              </div>

              <div>
                <label htmlFor="stock" style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: '#333',
                  fontSize: '14px'
                }}>
                  Stock
                </label>
                <input
                  type="number"
                  id="stock"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    backgroundColor: validando ? '#f8f9fa' : 'white',
                    cursor: validando ? 'not-allowed' : 'text'
                  }}
                  min="0"
                  placeholder="0"
                  disabled={validando}
                />
              </div>
            </div>

            {/* Nombre del producto */}
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="nombre" style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
                color: '#333',
                fontSize: '14px'
              }}>
                Nombre del Producto *
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  backgroundColor: validando ? '#f8f9fa' : 'white',
                  cursor: validando ? 'not-allowed' : 'text'
                }}
                placeholder="Ej: Parchita Cremosa, Pina Cremosa, etc."
                disabled={validando}
              />
            </div>

            {/* Grupo */}
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="grupo" style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
                color: '#333',
                fontSize: '14px'
              }}>
                Grupo *
              </label>
              <select
                id="grupo"
                name="grupo"
                value={formData.grupo}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: validando || grupos.length === 0 ? '#f8f9fa' : 'white',
                  cursor: validando || grupos.length === 0 ? 'not-allowed' : 'pointer',
                  color: '#333'
                }}
                disabled={validando || grupos.length === 0}
              >
                <option value="">Seleccionar grupo...</option>
                {grupos.map(grupo => (
                  <option key={grupo.id} value={grupo.nombre}>
                    {grupo.nombre} {grupo.precio > 0 ? `(+$${grupo.precio.toFixed(2)})` : ''}
                  </option>
                ))}
              </select>
              {grupos.length === 0 && (
                <div style={{
                  backgroundColor: '#fff3cd',
                  color: '#856404',
                  padding: '10px',
                  borderRadius: '4px',
                  marginTop: '10px',
                  fontSize: '13px',
                  border: '1px solid #ffeaa7'
                }}>
                  ⚠️ No hay grupos disponibles. Crea primero un grupo.
                </div>
              )}
            </div>

            {/* Imagen (oculta pero mantiene el campo en DB) */}
            <input
              type="hidden"
              id="imagen"
              name="imagen"
              value={formData.imagen}
            />
          </div>

          {/* Botones: Cancelar y Grabar */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            padding: '20px',
            borderTop: '1px solid #eee',
            backgroundColor: '#f8f9fa',
            borderBottomLeftRadius: '8px',
            borderBottomRightRadius: '8px'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 24px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: validando ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                opacity: validando ? 0.6 : 1,
                transition: 'all 0.2s ease'
              }}
              disabled={validando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 24px',
                backgroundColor: validando || grupos.length === 0 ? '#adb5bd' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: validando || grupos.length === 0 ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                opacity: validando || grupos.length === 0 ? 0.6 : 1,
                transition: 'all 0.2s ease'
              }}
              disabled={validando || grupos.length === 0}
            >
              {validando ? '⌛ Grabando...' : 
               producto ? '💾 Guardar Cambios' : '✅ Grabar Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalProducto;