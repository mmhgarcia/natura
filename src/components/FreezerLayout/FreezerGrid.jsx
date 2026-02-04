import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db/database';
import FreezerSlot from './FreezerSlot';

const FreezerGrid = ({ productosSeleccionados = [] }) => {
  const [containers, setContainers] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    seccion_code: '', // New field added [User Request]
    rows: [],
    color: '#f8f9fa'
  });

  const [currentRow, setCurrentRow] = useState({ label: '', value: '' });
  const [editingContainerId, setEditingContainerId] = useState(null);
  const [editingContainerName, setEditingContainerName] = useState('');

  // Grid configuration
  const COLS = 2;

  useEffect(() => {
    loadContainers();
  }, []);

  const loadContainers = async () => {
    try {
      await db.init();
      let allContainers = await db.freezer_containers.orderBy('order').toArray();

      if (allContainers.length === 0) {
        const defaultContainer = {
          name: 'Freezer 1',
          order: 0,
          color: '#e9ecef'
        };
        const containerId = await db.freezer_containers.add(defaultContainer);

        const newSlots = [];
        for (let c = 0; c < COLS; c++) {
          newSlots.push({
            id: `${containerId}_${c}`,
            containerId: containerId,
            row: 0,
            col: c,
            name: `Sección ${c + 1}`,
            seccion_code: '', // Initialise with empty string
            rows: [],
            color: '#f8f9fa'
          });
        }
        await db.freezer_slots.bulkAdd(newSlots);
        allContainers = [{ ...defaultContainer, id: containerId }];
      }

      for (let container of allContainers) {
        let slots = await db.freezer_slots.where('containerId').equals(container.id).toArray();
        slots = slots.map(slot => ({
          ...slot,
          rows: slot.rows || []
        }));
        slots.sort((a, b) => a.col - b.col);
        container.slots = slots;
      }
      setContainers(allContainers);
    } catch (error) {
      console.error("Error loading containers:", error);
    }
  };

  const addContainer = async () => {
    try {
      const nextOrder = containers.length;
      const newContainer = {
        name: `Freezer ${containers.length + 1}`,
        order: nextOrder,
        color: '#e9ecef'
      };
      const containerId = await db.freezer_containers.add(newContainer);

      const newSlots = [];
      for (let c = 0; c < COLS; c++) {
        newSlots.push({
          id: `${containerId}_${c}`,
          containerId: containerId,
          row: 0,
          col: c,
          name: `Sección ${c + 1}`,
          seccion_code: '',
          rows: [],
          color: '#f8f9fa'
        });
      }
      await db.freezer_slots.bulkAdd(newSlots);
      await loadContainers();
    } catch (error) {
      console.error("Error adding container:", error);
      alert("Error al añadir contenedor");
    }
  };

  const deleteContainer = async (containerId) => {
    if (!window.confirm('¿Estás seguro de eliminar este contenedor? Se perderán todos sus datos.')) {
      return;
    }
    try {
      await db.freezer_slots.where('containerId').equals(containerId).delete();
      await db.freezer_containers.delete(containerId);
      await loadContainers();
    } catch (error) {
      console.error("Error deleting container:", error);
      alert("Error al eliminar contenedor");
    }
  };

  const startEditingContainerName = (container) => {
    setEditingContainerId(container.id);
    setEditingContainerName(container.name);
  };

  const saveContainerName = async (containerId) => {
    if (!editingContainerName.trim()) {
      alert('El nombre no puede estar vacío');
      return;
    }
    try {
      const container = await db.freezer_containers.get(containerId);
      await db.freezer_containers.put({
        ...container,
        name: editingContainerName
      });
      setEditingContainerId(null);
      setEditingContainerName('');
      await loadContainers();
    } catch (error) {
      console.error("Error saving container name:", error);
      alert("Error al guardar nombre");
    }
  };

  const saveContainerColor = async (containerId, color) => {
    try {
      const container = await db.freezer_containers.get(containerId);
      await db.freezer_containers.put({
        ...container,
        color: color
      });
      await loadContainers();
    } catch (error) {
      console.error("Error saving container color:", error);
      alert("Error al guardar color");
    }
  };

  const handleSlotClick = (slot) => {
    setSelectedSlot(slot);
    setEditForm({
      name: slot.name,
      seccion_code: slot.seccion_code || '', // Load seccion_code [User Request]
      rows: slot.rows || [],
      color: slot.color || '#f8f9fa'
    });
    setCurrentRow({ label: '', value: '' });
    setIsEditing(true);
  };

  const handleAddRow = () => {
    if (!currentRow.label.trim() || !currentRow.value.trim()) {
      alert('Por favor completa ambos campos (Etiqueta y Valor)');
      return;
    }
    setEditForm({
      ...editForm,
      rows: [...editForm.rows, { ...currentRow }]
    });
    setCurrentRow({ label: '', value: '' });
  };

  const handleDeleteRow = (index) => {
    const newRows = editForm.rows.filter((_, i) => i !== index);
    setEditForm({ ...editForm, rows: newRows });
  };

  const handleSave = async () => {
    if (!selectedSlot) return;

    const updatedSlot = {
      ...selectedSlot,
      name: editForm.name,
      seccion_code: editForm.seccion_code, // Save seccion_code to DB [User Request]
      rows: editForm.rows,
      color: editForm.color
    };

    try {
      await db.freezer_slots.put(updatedSlot);
      await loadContainers();
      setIsEditing(false);
      setSelectedSlot(null);
    } catch (error) {
      console.error("Error saving slot:", error);
      alert("Error al guardar cambios");
    }
  };

  // Styles (Kept identical as per instructions)
  const containerStyle = { padding: '15px', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' };
  const addBtnStyle = { padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#007bff', color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' };
  const containerNameStyle = { margin: 0, color: '#333', cursor: 'pointer', padding: '8px 12px', borderRadius: '6px', transition: 'background-color 0.2s' };
  const containerNameInputStyle = { flex: 1, padding: '8px 12px', borderRadius: '6px', border: '2px solid #007bff', fontSize: '16px', fontWeight: 'bold' };
  const colorSelectStyle = { padding: '8px 12px', borderRadius: '6px', border: '1px solid #ced4da', backgroundColor: 'white', cursor: 'pointer', fontSize: '14px' };
  const deleteBtnStyle = { padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#dc3545', color: 'white', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' };
  const gridStyle = { display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: '10px', padding: '15px', borderRadius: '12px', border: '3px solid #495057', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', position: 'relative' };
  const editorStyle = { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 -4px 10px rgba(0,0,0,0.1)', position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000, maxHeight: '80vh', overflowY: 'auto' };
  const formGroupStyle = { marginBottom: '15px' };
  const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box' };
  const rowInputContainerStyle = { display: 'flex', gap: '8px', marginBottom: '10px' };
  const rowListStyle = { listStyle: 'none', padding: 0, margin: '10px 0', maxHeight: '200px', overflowY: 'auto', border: '1px solid #e9ecef', borderRadius: '6px' };
  const rowItemStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #f1f3f5', backgroundColor: '#f8f9fa' };
  const btnStyle = { padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold' };
  const smallBtnStyle = { padding: '6px 12px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' };

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h2 style={{ margin: 0 }}>Distribución del Freezer</h2>
        <button style={addBtnStyle} onClick={addContainer}>➕ Añadir Contenedor</button>
      </div>

      {containers.map(container => (
        <div key={container.id} style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            {editingContainerId === container.id ? (
              <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                <input
                  style={containerNameInputStyle}
                  value={editingContainerName}
                  onChange={(e) => setEditingContainerName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && saveContainerName(container.id)}
                  autoFocus
                />
                <button style={{ ...smallBtnStyle, backgroundColor: '#28a745', color: 'white' }} onClick={() => saveContainerName(container.id)}>✓</button>
                <button style={{ ...smallBtnStyle, backgroundColor: '#6c757d', color: 'white' }} onClick={() => { setEditingContainerId(null); setEditingContainerName(''); }}>✗</button>
              </div>
            ) : (
              <h3 style={containerNameStyle} onClick={() => startEditingContainerName(container)}>{container.name}</h3>
            )}
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <select style={colorSelectStyle} value={container.color} onChange={(e) => saveContainerColor(container.id, e.target.value)}>
                <option value="#e9ecef">Gris</option>
                <option value="#cce5ff">Azul Claro</option>
                <option value="#d4edda">Verde Claro</option>
                <option value="#fff3cd">Amarillo</option>
                <option value="#f8d7da">Rosa</option>
                <option value="#343a40">Gris Oscuro</option>
                <option value="#007bff">Azul</option>
              </select>
              <button style={deleteBtnStyle} onClick={() => deleteContainer(container.id)}>🗑️</button>
            </div>
          </div>

          <div style={{ ...gridStyle, backgroundColor: container.color }}>
            {container.slots && container.slots.map(slot => (
              <FreezerSlot
                key={slot.id}
                slotData={slot}
                onClick={() => handleSlotClick(slot)}
                isSelected={selectedSlot && selectedSlot.id === slot.id}
              />
            ))}
          </div>
        </div>
      ))}

      {isEditing && (
        <div style={editorStyle}>
          <h3 style={{ marginTop: 0 }}>Editar Sección</h3>
          
          {/* New Seccion:Code field added above Titulo [User Request] */}
          <div style={formGroupStyle}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Seccion:Code</label>
            <input
              type="text"
              style={inputStyle}
              value={editForm.seccion_code}
              onChange={(e) => setEditForm({ ...editForm, seccion_code: e.target.value })}
              placeholder="Ingrese código de sección"
            />
          </div>

          <div style={formGroupStyle}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Título (Sabor):</label>
            <input
              type="text"
              style={inputStyle}
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              placeholder="Ej. Chocolate"
            />
          </div>

          <div style={formGroupStyle}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Filas de Información:</label>
            <div style={rowInputContainerStyle}>
              <input
                style={{ ...inputStyle, flex: 1 }}
                value={currentRow.label}
                onChange={(e) => setCurrentRow({ ...currentRow, label: e.target.value })}
                placeholder="Etiqueta (ej. Lote)"
              />
              <input
                style={{ ...inputStyle, flex: 1 }}
                value={currentRow.value}
                onChange={(e) => setCurrentRow({ ...currentRow, value: e.target.value })}
                placeholder="Valor (ej. 123)"
              />
              <button style={{ ...smallBtnStyle, backgroundColor: '#007bff', color: 'white' }} onClick={handleAddRow}>+ Añadir</button>
            </div>

            {editForm.rows.length > 0 && (
              <ul style={rowListStyle}>
                {editForm.rows.map((row, index) => (
                  <li key={index} style={rowItemStyle}>
                    <span><strong>{row.label}:</strong> {row.value}</span>
                    <button style={{ ...smallBtnStyle, backgroundColor: '#dc3545', color: 'white' }} onClick={() => handleDeleteRow(index)}>Eliminar</button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div style={formGroupStyle}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Color:</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {['#f8f9fa', '#ffcccc', '#ccffcc', '#cce5ff', '#fff3cd'].map(c => (
                <div
                  key={c}
                  onClick={() => setEditForm({ ...editForm, color: c })}
                  style={{
                    width: '30px',
                    height: '30px',
                    backgroundColor: c,
                    borderRadius: '50%',
                    cursor: 'pointer',
                    border: editForm.color === c ? '2px solid #333' : '1px solid #ddd'
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '15px' }}>
            <button style={{ ...btnStyle, backgroundColor: '#6c757d', color: 'white' }} onClick={() => setIsEditing(false)}>Cancelar</button>
            <button style={{ ...btnStyle, backgroundColor: '#28a745', color: 'white' }} onClick={handleSave}>Guardar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FreezerGrid;