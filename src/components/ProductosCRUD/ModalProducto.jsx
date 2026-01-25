import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db/database'; // Acceso a dbTasaBCV [4]

const ModalProducto = ({ producto, grupos, onClose, onSave }) => {
  // Estado inicial incluyendo el campo 'visible' soportado en la versión 8 de la DB [1, 2]
  const [formData, setFormData] = useState({
    id: '',
    nombre: '',
    grupo: '',
    stock: 0,
    imagen: '',
    visible: true 
  });

  const [error, setError] = useState('');
  const [validando, setValidando] = useState(false);

  // Efecto para cargar los datos del producto al editar [2, 5]
  useEffect(() => {
    if (producto) {
      setFormData({
        id: producto.id.toString(),
        nombre: producto.nombre || '',
        grupo: producto.grupo || '',
        stock: producto.stock || 0,
        imagen: producto.imagen || '',
        // Se asegura la carga del campo visible (predeterminado a true si no existe) [1]
        visible: producto.visible !== undefined ? producto.visible : true 
      });
    } else {
      setFormData({
        id: '',
        nombre: '',
        grupo: grupos.length > 0 ? grupos.nombre : '',
        stock: 0,
        imagen: '',
        visible: true
      });
    }
  }, [producto, grupos]);

  // Valida que el ID no esté duplicado en IndexedDB [5]
  const validarIdExistente = async (id) => {
    try {
      const existe = await db.get('productos', parseInt(id));
      return !!existe;
    } catch (err) {
      console.error('Error validando ID:', err);
      return false;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Manejo específico para el campo booleano 'visible'
    if (name === 'visible') {
      setFormData(prev => ({ ...prev, visible: value === 'true' }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: name === 'stock' || name === 'id' ?
        (value === '' ? '' : value.replace(/\D/g, '')) :
        value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setValidando(true);

    // Validaciones básicas de integridad [3, 5]
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

    try {
      const dataToSave = {
        id: idNumero,
        nombre: formData.nombre,
        grupo: formData.grupo,
        stock: parseInt(formData.stock),
        imagen: formData.imagen,
        visible: formData.visible, // Persistencia del estado de visibilidad [1]
        createdAt: producto ? producto.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (producto) {
        const idCambiado = idNumero !== producto.id;
        if (idCambiado) {
          const idExiste = await validarIdExistente(idNumero);
          if (idExiste) {
            setError(`El ID ${idNumero} ya está en uso`);
            setValidando(false);
            return;
          }
          await db.del('productos', producto.id);
          await db.add('productos', dataToSave);
        } else {
          await db.put('productos', dataToSave); // Actualiza registro existente [6]
        }
      } else {
        const idExiste = await validarIdExistente(idNumero);
        if (idExiste) {
          setError(`El ID ${idNumero} ya está en uso`);
          setValidando(false);
          return;
        }
        await db.add('productos', dataToSave); // Crea nuevo registro [7]
      }

      onSave(); // Refresca la lista en el componente padre [8]
      onClose();
    } catch (err) {
      setError('Error al guardar: ' + err.message);
    } finally {
      setValidando(false);
    }
  };

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.modal}>
        <div style={modalStyles.header}>
          <h3 style={{ margin: 0, color: '#333' }}>
            {producto ? '✏️ Editar Producto' : '➕ Nuevo Producto'}
          </h3>
          <button onClick={onClose} style={modalStyles.closeBtn}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          {error && (
            <div style={modalStyles.errorBox}>
              ⚠️ {error}
            </div>
          )}

          {/* Fila: ID y Stock [9] */}
          <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}>
              <label style={modalStyles.label}>ID *</label>
              <input 
                type="text" 
                name="id" 
                value={formData.id} 
                onChange={handleChange} 
                disabled={validando || !!producto} 
                style={inputStyle(validando)} 
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={modalStyles.label}>Stock</label>
              <input 
                type="text" 
                name="stock" 
                value={formData.stock} 
                onChange={handleChange} 
                disabled={validando} 
                style={inputStyle(validando)} 
              />
            </div>
          </div>

          {/* Campo: Nombre [9] */}
          <div style={{ marginBottom: '15px' }}>
            <label style={modalStyles.label}>Nombre del Producto *</label>
            <input 
              type="text" 
              name="nombre" 
              value={formData.nombre} 
              onChange={handleChange} 
              disabled={validando} 
              style={inputStyle(validando)} 
            />
          </div>

          {/* Campo: Ruta de la Imagen [10] */}
          <div style={{ marginBottom: '15px' }}>
            <label style={modalStyles.label}>Ruta de la Imagen</label>
            <input 
              type="text" 
              name="imagen" 
              value={formData.imagen} 
              onChange={handleChange} 
              disabled={validando} 
              placeholder="/outputs/small/nombre_400.webp" 
              style={inputStyle(validando)} 
            />
          </div>

          {/* Campo: Visibilidad (Nuevo control basado en esquema v8) [1] */}
          <div style={{ marginBottom: '15px' }}>
            <label style={modalStyles.label}>Estado en Catálogo</label>
            <select
              name="visible"
              value={formData.visible.toString()}
              onChange={handleChange}
              disabled={validando}
              style={{ ...inputStyle(validando), cursor: 'pointer' }}
            >
              <option value="true">🟢 Visible (Disponible en Home)</option>
              <option value="false">⚪ Oculto (Solo visible en Admin)</option>
            </select>
          </div>

          {/* Campo: Grupo [10] */}
          <div style={{ marginBottom: '20px' }}>
            <label style={modalStyles.label}>Grupo *</label>
            <select 
              name="grupo" 
              value={formData.grupo} 
              onChange={handleChange} 
              disabled={validando} 
              style={{ ...inputStyle(validando), cursor: 'pointer' }}
            >
              <option value="">Seleccionar grupo...</option>
              {grupos.map(grupo => (
                <option key={grupo.id} value={grupo.nombre}>
                  {grupo.nombre} {grupo.precio > 0 ? `(+$${grupo.precio.toFixed(2)})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div style={modalStyles.footer}>
            <button 
              type="button" 
              onClick={onClose} 
              disabled={validando} 
              style={modalStyles.btnCancel}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={validando} 
              style={modalStyles.btnSave}
            >
              {validando ? '⌛ Grabando...' : producto ? '💾 Guardar Cambios' : '✅ Grabar Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Estilos basados en la estructura del proyecto [11, 12]
const modalStyles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
  },
  modal: {
    backgroundColor: 'white', borderRadius: '8px', width: '100%',
    maxWidth: '500px', maxHeight: '90vh', display: 'flex',
    flexDirection: 'column', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    overflowY: 'auto'
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '20px', borderBottom: '1px solid #eee', backgroundColor: '#f8f9fa'
  },
  closeBtn: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#666' },
  label: { display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '14px', color: '#333' },
  errorBox: {
    backgroundColor: '#fee', color: '#c33', padding: '12px',
    borderRadius: '4px', marginBottom: '20px', fontSize: '14px', border: '1px solid #fcc'
  },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid #eee', padding: '20px' },
  btnCancel: { padding: '10px 24px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  btnSave: { padding: '10px 24px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }
};

const inputStyle = (validando) => ({
  width: '100%', padding: '10px', border: '1px solid #ddd',
  borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box',
  backgroundColor: validando ? '#f8f9fa' : 'white',
  color: '#333', cursor: validando ? 'not-allowed' : 'text'
});

export default ModalProducto;