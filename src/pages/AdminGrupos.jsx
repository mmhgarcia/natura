// src/pages/GestionGrupos.jsx
import React, { useState, useEffect } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";

// Valores por defecto
const FACTORES_DEFAULT = {
  Cremoso: 0.5,
  FullCremoso: 0.7,
  Premium: 1.0,
  Ninguno: 0.0
};

export default function GestionGrupos() {
  // El hook devuelve un array, tomamos el primer objeto
  const [grupos, setGrupos] = useLocalStorage("grupos", [FACTORES_DEFAULT]);
  
  // Estado para los valores editados
  const [valores, setValores] = useState(FACTORES_DEFAULT);

  // Cuando grupos cambia, actualizar los valores
  useEffect(() => {
    if (grupos.length > 0 && grupos[0]) {
      setValores(grupos[0]);
    }
  }, [grupos]);

  // Manejar cambio en un textbox
  const handleChange = (factor, valor) => {
    setValores(prev => ({
      ...prev,
      [factor]: parseFloat(valor) || 0
    }));
  };

  // Grabar cambios
  const grabar = () => {
    setGrupos([valores]);
    alert("Factores guardados");
  };

  // Eliminar (resetear a valores por defecto)
  const eliminar = () => {
    if (confirm("¿Restablecer valores por defecto?")) {
      setValores(FACTORES_DEFAULT);
      setGrupos([FACTORES_DEFAULT]);
    }
  };

  // Estilos minimalistas
  const styles = {
    container: {
      padding: "20px",
      maxWidth: "400px",
      margin: "0 auto"
    },
    header: {
      marginBottom: "30px",
      textAlign: "center"
    },
    bloque: {
      marginBottom: "20px"
    },
    label: {
      display: "block",
      marginBottom: "5px",
      fontWeight: "bold"
    },
    input: {
      width: "100%",
      padding: "10px",
      border: "1px solid #ccc",
      borderRadius: "4px",
      fontSize: "16px"
    },
    botones: {
      display: "flex",
      gap: "10px",
      marginTop: "30px"
    },
    button: {
      padding: "10px 20px",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "16px",
      flex: 1
    },
    grabar: {
      background: "#4CAF50",
      color: "white"
    },
    eliminar: {
      background: "#f44336",
      color: "white"
    },
    currentValue: {
      fontSize: "12px",
      color: "#666",
      marginTop: "3px"
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Editar Factores</h1>
      
      {/* Bloque 1: Cremoso */}
      <div style={styles.bloque}>
        <label style={styles.label}>Cremoso</label>
        <input
          type="number"
          step="0.1"
          value={valores.Cremoso}
          onChange={(e) => handleChange("Cremoso", e.target.value)}
          style={styles.input}
        />
        <div style={styles.currentValue}>
          Valor actual: {grupos[0]?.Cremoso || 0}
        </div>
      </div>

      {/* Bloque 2: Full Cremoso */}
      <div style={styles.bloque}>
        <label style={styles.label}>Full Cremoso</label>
        <input
          type="number"
          step="0.1"
          value={valores.FullCremoso}
          onChange={(e) => handleChange("FullCremoso", e.target.value)}
          style={styles.input}
        />
        <div style={styles.currentValue}>
          Valor actual: {grupos[0]?.FullCremoso || 0}
        </div>
      </div>

      {/* Bloque 3: Premium */}
      <div style={styles.bloque}>
        <label style={styles.label}>Premium</label>
        <input
          type="number"
          step="0.1"
          value={valores.Premium}
          onChange={(e) => handleChange("Premium", e.target.value)}
          style={styles.input}
        />
        <div style={styles.currentValue}>
          Valor actual: {grupos[0]?.Premium || 0}
        </div>
      </div>

      {/* Bloque 4: Ninguno */}
      <div style={styles.bloque}>
        <label style={styles.label}>Ninguno</label>
        <input
          type="number"
          step="0.1"
          value={valores.Ninguno}
          onChange={(e) => handleChange("Ninguno", e.target.value)}
          style={styles.input}
        />
        <div style={styles.currentValue}>
          Valor actual: {grupos[0]?.Ninguno || 0}
        </div>
      </div>

      {/* Bloque 5: Botones */}
      <div style={styles.botones}>
        <button 
          onClick={grabar}
          style={{ ...styles.button, ...styles.grabar }}
        >
          Grabar
        </button>
        <button 
          onClick={eliminar}
          style={{ ...styles.button, ...styles.eliminar }}
        >
          Eliminar
        </button>
      </div>

      {/* Vista JSON (opcional) */}
      <details style={{ marginTop: "30px" }}>
        <summary style={{ cursor: "pointer", color: "#666" }}>
          Ver datos almacenados
        </summary>
        <pre style={{
          background: "#f5f5f5",
          padding: "10px",
          borderRadius: "4px",
          fontSize: "12px",
          overflow: "auto"
        }}>
          {JSON.stringify(grupos, null, 2)}
        </pre>
      </details>
    </div>
  );
}