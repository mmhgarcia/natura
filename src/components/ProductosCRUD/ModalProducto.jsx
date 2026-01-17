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
            setFormData({
                id: '',
                nombre: '',
                grupo: grupos.length > 0 ? grupos.nombre : '',
                stock: 0,
                imagen: ''
            });
        }
    }, [producto, grupos]);

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
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
            <div style={{
                backgroundColor: 'white', borderRadius: '8px', width: '100%',
                maxWidth: '500px', maxHeight: '90vh', display: 'flex',
                flexDirection: 'column', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
            }}>
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '20px', borderBottom: '1px solid #eee', backgroundColor: '#f8f9fa'
                }}>
                    <h3 style={{ margin: 0, color: '#333' }}>
                        {producto ? '✏️ Editar Producto' : '➕ Nuevo Producto'}
                    </h3>
                    <button onClick={onClose} style={{
                        background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer',
                        color: '#666', width: '30px', height: '30px'
                    }}>×</button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '20px', overflowY: 'auto' }}>
                    {error && (
                        <div style={{
                            backgroundColor: '#fee', color: '#c33', padding: '12px',
                            borderRadius: '4px', marginBottom: '20px', fontSize: '14px', border: '1px solid #fcc'
                        }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>ID *</label>
                            <input
                                type="text"
                                name="id"
                                value={formData.id}
                                onChange={handleChange}
                                style={{
                                    width: '100%', padding: '10px', border: '1px solid #ddd',
                                    borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box',
                                    backgroundColor: validando ? '#f8f9fa' : 'white',
                                    color: '#333', cursor: validando ? 'not-allowed' : 'text'
                                }}
                                disabled={validando}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>Stock</label>
                            <input
                                type="number"
                                name="stock"
                                value={formData.stock}
                                onChange={handleChange}
                                style={{
                                    width: '100%', padding: '10px', border: '1px solid #ddd',
                                    borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box',
                                    backgroundColor: validando ? '#f8f9fa' : 'white',
                                    color: '#333', cursor: validando ? 'not-allowed' : 'text'
                                }}
                                disabled={validando}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>Nombre del Producto *</label>
                        <input
                            type="text"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                            style={{
                                width: '100%', padding: '10px', border: '1px solid #ddd',
                                borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box',
                                backgroundColor: validando ? '#f8f9fa' : 'white',
                                color: '#333', cursor: validando ? 'not-allowed' : 'text'
                            }}
                            disabled={validando}
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333', fontSize: '14px' }}>Grupo *</label>
                        <select
                            name="grupo"
                            value={formData.grupo}
                            onChange={handleChange}
                            style={{
                                width: '100%', padding: '10px', border: '1px solid #ddd',
                                borderRadius: '4px', fontSize: '14px', 
                                backgroundColor: validando || grupos.length === 0 ? '#f8f9fa' : 'white',
                                color: '#333', cursor: (validando || grupos.length === 0) ? 'not-allowed' : 'pointer'
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
                    </div>

                    <input type="hidden" name="imagen" value={formData.imagen} />

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                        <button type="button" onClick={onClose} style={{
                            padding: '10px 24px', backgroundColor: '#6c757d', color: 'white',
                            border: 'none', borderRadius: '4px', cursor: 'pointer'
                        }}>Cancelar</button>
                        <button type="submit" style={{
                            padding: '10px 24px', backgroundColor: '#28a745', color: 'white',
                            border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer'
                        }} disabled={validando}>
                            {validando ? '⌛ Grabando...' : producto ? '💾 Guardar Cambios' : '✅ Grabar Producto'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalProducto;