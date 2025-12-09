// src/pages/GestionGrupos.jsx
import React, { useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";

// Valores por defecto si no hay nada en localStorage
const GRUPOS_FALLBACK = [
  {
    Cremoso: 0.5,
    FullCremoso: 0.7,
    Premium: 1.0,
    Ninguno: 0.0
  }
];

// Leer de localStorage
const getGruposFromStorage = () => {
  if (typeof window === "undefined") return GRUPOS_FALLBACK;
  
  try {
    const stored = localStorage.getItem("grupos");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    return GRUPOS_FALLBACK;
  } catch {
    return GRUPOS_FALLBACK;
  }
};

const GRUPOS_DEFAULT = getGruposFromStorage();

export default function AdminGrupos() {
  const [grupos, setGrupos] = useLocalStorage("grupos", GRUPOS_DEFAULT);
  const [editing, setEditing] = useState(false);
  const [currentFactor, setCurrentFactor] = useState({ nombre: "", valor: 0 });
  const [editingName, setEditingName] = useState("");

  const factores = grupos[0] || {};

  // Agregar factor
  const agregarFactor = () => {
    if (!currentFactor.nombre.trim()) {
      alert("Nombre vacío");
      return;
    }
    if (factores[currentFactor.nombre] !== undefined) {
      alert("Ya existe");
      return;
    }

    setGrupos([{
      ...factores,
      [currentFactor.nombre]: parseFloat(currentFactor.valor) || 0
    }]);
    setCurrentFactor({ nombre: "", valor: 0 });
    setEditing(false);
  };

  // Actualizar factor
  const actualizarFactor = () => {
    if (!editingName || !currentFactor.nombre.trim()) return;

    const nuevosFactores = { ...factores };
    if (editingName !== currentFactor.nombre) {
      delete nuevosFactores[editingName];
    }
    nuevosFactores[currentFactor.nombre] = parseFloat(currentFactor.valor) || 0;
    
    setGrupos([nuevosFactores]);
    setCurrentFactor({ nombre: "", valor: 0 });
    setEditingName("");
    setEditing(false);
  };

  // Eliminar factor
  const eliminarFactor = (nombre) => {
    if (nombre === "Ninguno") {
      alert("No se puede eliminar 'Ninguno'");
      return;
    }
    if (!confirm(`¿Eliminar ${nombre}?`)) return;
    
    const nuevosFactores = { ...factores };
    delete nuevosFactores[nombre];
    setGrupos([nuevosFactores]);
  };

  // Editar factor
  const editarFactor = (nombre) => {
    if (nombre === "Ninguno") {
      alert("No editable");
      return;
    }
    setEditing(true);
    setEditingName(nombre);
    setCurrentFactor({ nombre, valor: factores[nombre] });
  };

  // Reset
  const resetFactores = () => {
    if (confirm("¿Resetear a valores por defecto?")) {
      setGrupos(GRUPOS_FALLBACK);
      setEditing(false);
      setCurrentFactor({ nombre: "", valor: 0 });
      setEditingName("");
    }
  };

  const totalFactores = Object.keys(factores).length;

  // Estilos minimalistas
  const styles = {
    container: { padding: "20px", maxWidth: "800px", margin: "0 auto" },
    header: { marginBottom: "20px" },
    stats: { 
      background: "#f5f5f5", 
      padding: "10px", 
      marginBottom: "20px",
      borderRadius: "4px" 
    },
    formContainer: { 
      border: "1px solid #ddd", 
      padding: "15px", 
      marginBottom: "20px",
      borderRadius: "4px" 
    },
    inputGroup: { 
      display: "flex", 
      gap: "10px", 
      marginBottom: "10px" 
    },
    input: { 
      padding: "8px", 
      border: "1px solid #ccc", 
      borderRadius: "4px",
      flex: 1 
    },
    button: { 
      padding: "8px 16px", 
      border: "none", 
      borderRadius: "4px",
      cursor: "pointer" 
    },
    buttonPrimary: { background: "#007bff", color: "white" },
    buttonSuccess: { background: "#28a745", color: "white" },
    buttonDanger: { background: "#dc3545", color: "white" },
    buttonSecondary: { background: "#6c757d", color: "white" },
    buttonWarning: { background: "#ffc107", color: "black" },
    factorsGrid: { 
      display: "grid", 
      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
      gap: "10px",
      marginBottom: "20px" 
    },
    factorCard: { 
      border: "1px solid #ddd", 
      padding: "10px",
      borderRadius: "4px" 
    },
    factorHeader: { 
      display: "flex", 
      justifyContent: "space-between",
      marginBottom: "5px" 
    },
    factorName: { fontWeight: "bold" },
    factorValue: { 
      background: "#e9ecef", 
      padding: "2px 6px",
      borderRadius: "3px" 
    },
    slider: { width: "100%", margin: "5px 0" },
    cardButtons: { 
      display: "flex", 
      gap: "5px", 
      marginTop: "8px" 
    },
    smallButton: { 
      padding: "4px 8px", 
      fontSize: "12px",
      flex: 1 
    },
    jsonView: { 
      background: "#f8f9fa", 
      padding: "10px", 
      fontSize: "12px",
      borderRadius: "4px",
      overflow: "auto" 
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Gestión de Factores</h1>
      
      <div style={styles.stats}>
        Factores: {totalFactores}
      </div>

      {/* Formulario */}
      <div style={styles.formContainer}>
        <h3>{editing ? "Editar Factor" : "Nuevo Factor"}</h3>
        <div style={styles.inputGroup}>
          <input
            type="text"
            placeholder="Nombre"
            value={currentFactor.nombre}
            onChange={(e) => setCurrentFactor(prev => ({ ...prev, nombre: e.target.value }))}
            style={styles.input}
          />
          <input
            type="number"
            placeholder="Valor"
            value={currentFactor.valor}
            onChange={(e) => setCurrentFactor(prev => ({ ...prev, valor: e.target.value }))}
            step="0.1"
            style={styles.input}
          />
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          {editing ? (
            <>
              <button 
                onClick={actualizarFactor}
                style={{ ...styles.button, ...styles.buttonSuccess }}
              >
                Guardar
              </button>
              <button 
                onClick={() => { setEditing(false); setCurrentFactor({ nombre: "", valor: 0 }); }}
                style={{ ...styles.button, ...styles.buttonSecondary }}
              >
                Cancelar
              </button>
            </>
          ) : (
            <button 
              onClick={agregarFactor}
              style={{ ...styles.button, ...styles.buttonPrimary }}
            >
              Agregar
            </button>
          )}
        </div>
      </div>

      {/* Botón Reset */}
      <div style={{ marginBottom: "15px" }}>
        <button 
          onClick={resetFactores}
          style={{ ...styles.button, ...styles.buttonWarning }}
        >
          Resetear
        </button>
      </div>

      {/* Lista de Factores */}
      <div style={styles.factorsGrid}>
        {Object.entries(factores).map(([nombre, valor]) => (
          <div key={nombre} style={styles.factorCard}>
            <div style={styles.factorHeader}>
              <div style={styles.factorName}>{nombre}</div>
              <div style={styles.factorValue}>{valor.toFixed(1)}</div>
            </div>
            <input
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={valor}
              onChange={(e) => {
                const nuevosFactores = { ...factores };
                nuevosFactores[nombre] = parseFloat(e.target.value);
                setGrupos([nuevosFactores]);
              }}
              style={styles.slider}
            />
            <div style={styles.cardButtons}>
              <button 
                onClick={() => editarFactor(nombre)}
                style={{ ...styles.button, ...styles.smallButton, background: "#e9ecef" }}
                disabled={nombre === "Ninguno"}
              >
                Editar
              </button>
              <button 
                onClick={() => eliminarFactor(nombre)}
                style={{ ...styles.button, ...styles.smallButton, ...styles.buttonDanger }}
                disabled={nombre === "Ninguno"}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Vista JSON */}
      <details>
        <summary>Ver JSON</summary>
        <pre style={styles.jsonView}>
          {JSON.stringify(grupos, null, 2)}
        </pre>
      </details>
    </div>
  );
}