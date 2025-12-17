// src/pages/TasaBCV.jsx
import { useState } from 'react';
import { useTasaBCV } from "../lib/db/hooks/useTasaBCV";
import styles from './TasaBCV.module.css'; // Opcional

export default function TasaBCV() {
  const { tasa, setTasa, saveTasa, loading } = useTasaBCV();
  const [message, setMessage] = useState('');

  // Manejar cambio de input
  const handleChange = (e) => {
    let valor = e.target.value;
    
    // Permitir solo números y un punto decimal
    valor = valor.replace(/[^0-9.]/g, '');
    
    // Asegurar solo un punto decimal
    const puntos = valor.split('.').length - 1;
    if (puntos > 1) {
      // Si hay más de un punto, mantener solo el primero
      const partes = valor.split('.');
      valor = partes[0] + '.' + partes.slice(1).join('');
    }
    
    setTasa(valor);
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!tasa.trim()) {
      setMessage('⚠️ Ingresa un valor para la tasa');
      return;
    }

    // Convertir a número para validación
    const tasaNumero = parseFloat(tasa.replace(',', '.'));
    
    if (isNaN(tasaNumero) || tasaNumero <= 0) {
      setMessage('❌ Ingresa un número válido mayor que 0');
      return;
    }

    setMessage('💾 Guardando...');
    
    const success = await saveTasa(tasa);
    
    if (success) {
      setMessage(`✅ Tasa BCV guardada: $${tasaNumero.toFixed(2)}`);
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage('❌ Error al guardar la tasa');
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>⏳ Cargando tasa BCV...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>💰 Tasa BCV</h1>
      
      <div className={styles.currentRate}>
        {tasa ? (
          <>
            <span>Tasa actual: </span>
            <strong>${parseFloat(tasa).toFixed(2)}</strong>
          </>
        ) : (
          <span>No hay tasa configurada</span>
        )}
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label htmlFor="tasa">Nueva Tasa BCV:</label>
          <input
            id="tasa"
            type="text"
            inputMode="decimal"
            pattern="[0-9]*[.]?[0-9]*"
            placeholder="Ej: 36.50"
            value={tasa}
            onChange={handleChange}
            className={styles.input}
          />
          <small className={styles.hint}>
            Usa punto decimal (ej: 36.50)
          </small>
        </div>

        {message && (
          <div className={`${styles.message} ${
            message.includes('✅') ? styles.success : 
            message.includes('⚠️') ? styles.warning : 
            styles.error
          }`}>
            {message}
          </div>
        )}

        <button 
          type="submit" 
          className={styles.button}
          disabled={!tasa.trim()}
        >
          💾 Guardar Tasa
        </button>
      </form>
    </div>
  );
}