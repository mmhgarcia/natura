// Gestiona el parametro de sistema: Delivery
import React, { useState, useEffect } from 'react';
import { db } from '../lib/db/database';

const Delivery = () => {
  const [costoDelivery, setCostoDelivery] = useState('');
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  // Cargar costo de delivery al inicio
  useEffect(() => {
    cargarDelivery();
  }, []);

  const cargarDelivery = async () => {
    try {
      setLoading(true);
      // Buscar en la tabla 'config' donde clave = 'delivery'
      const config = await db.get('config', 'delivery');
      
      if (config && config.valor !== undefined) {
        setCostoDelivery(String(config.valor));
      } else {
        setCostoDelivery(''); // Vacío si no existe
      }
      setMensaje('');
    } catch (error) {
      console.error('Error cargando delivery:', error);
      setMensaje('❌ Error al cargar el costo de delivery');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    let valor = e.target.value;
    
    // Permitir solo números y un punto decimal
    valor = valor.replace(/[^0-9.]/g, '');
    
    // Asegurar solo un punto decimal
    const puntos = valor.split('.').length - 1;
    if (puntos > 1) {
      const partes = valor.split('.');
      valor = partes[0] + '.' + partes.slice(1).join('');
    }
    
    setCostoDelivery(valor);
    setMensaje(''); // Limpiar mensaje al cambiar
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!costoDelivery.trim()) {
      setMensaje('⚠️ Ingresa un valor para el delivery');
      return;
    }

    // Convertir a número para validación
    const valorNumero = parseFloat(costoDelivery.replace(',', '.'));
    
    if (isNaN(valorNumero) || valorNumero < 0) {
      setMensaje('❌ Ingresa un número válido (mayor o igual a 0)');
      return;
    }

    setGuardando(true);
    setMensaje('💾 Guardando...');

    try {
      // Guardar en IndexedDB
      await db.put('config', {
        clave: 'delivery',
        valor: valorNumero,
        tipo: 'costo_servicio',
        moneda: 'USD',
        updatedAt: new Date().toISOString()
      });

      setMensaje(`✅ Costo de delivery guardado: $${valorNumero.toFixed(2)}`);
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMensaje(''), 3000);
      
    } catch (error) {
      setMensaje('❌ Error al guardar: ' + error.message);
      console.error(error);
    } finally {
      setGuardando(false);
    }
  };

  const handleLimpiar = () => {
    setCostoDelivery('');
    setMensaje('');
  };

  // Estilos
  const styles = {
    container: {
      maxWidth: '500px',
      margin: '0 auto',
      padding: '20px'
    },
    titulo: {
      color: '#2c3e50',
      textAlign: 'center',
      marginBottom: '30px',
      fontSize: '24px',
      fontWeight: 'bold'
    },
    formContainer: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '25px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '500',
      marginBottom: '8px',
      color: '#2c3e50'
    },
    input: {
      width: '100%',
      padding: '12px 15px',
      fontSize: '16px',
      border: '2px solid #ddd',
      borderRadius: '8px',
      boxSizing: 'border-box',
      transition: 'border-color 0.3s'
    },
    inputFocus: {
      borderColor: '#3498db',
      outline: 'none',
      boxShadow: '0 0 0 3px rgba(52, 152, 219, 0.2)'
    },
    mensaje: {
      padding: '12px 15px',
      borderRadius: '8px',
      marginBottom: '20px',
      textAlign: 'center',
      fontWeight: '500'
    },
    mensajeExito: {
      backgroundColor: '#d4edda',
      color: '#155724',
      border: '1px solid #c3e6cb'
    },
    mensajeError: {
      backgroundColor: '#f8d7da',
      color: '#721c24',
      border: '1px solid #f5c6cb'
    },
    mensajeInfo: {
      backgroundColor: '#d1ecf1',
      color: '#0c5460',
      border: '1px solid #bee5eb'
    },
    botonesContainer: {
      display: 'flex',
      gap: '12px',
      marginTop: '25px'
    },
    boton: {
      padding: '12px 20px',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s',
      flex: 1
    },
    botonLimpiar: {
      backgroundColor: '#95a5a6',
      color: 'white'
    },
    botonGuardar: {
      backgroundColor: '#27ae60',
      color: 'white'
    },
    botonDeshabilitado: {
      backgroundColor: '#bdc3c7',
      cursor: 'not-allowed',
      opacity: 0.7
    },
    loading: {
      textAlign: 'center',
      padding: '40px',
      color: '#7f8c8d',
      fontSize: '16px'
    },
    infoBox: {
      marginTop: '25px',
      padding: '15px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      fontSize: '13px',
      color: '#6c757d',
      borderLeft: '4px solid #3498db'
    },
    currentValue: {
      textAlign: 'center',
      padding: '15px',
      backgroundColor: '#e8f4fc',
      borderRadius: '8px',
      marginBottom: '20px',
      border: '1px solid #d6e9f9'
    },
    currentValueText: {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#2c3e50'
    },
    currentValueLabel: {
      fontSize: '12px',
      color: '#7f8c8d',
      marginTop: '5px'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={{ 
            border: '4px solid #f3f3f3', 
            borderTop: '4px solid #3498db', 
            borderRadius: '50%', 
            width: '40px', 
            height: '40px', 
            margin: '0 auto 20px',
            animation: 'spin 1s linear infinite' 
          }}></div>
          Cargando costo de delivery...
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.titulo}>🚚 Costo de Delivery</h1>
      
      {/* Valor actual */}
      <div style={styles.currentValue}>
        <div style={styles.currentValueText}>
          {costoDelivery ? `$${parseFloat(costoDelivery).toFixed(2)}` : 'No configurado'}
        </div>
        <div style={styles.currentValueLabel}>
          Costo actual por servicio de delivery
        </div>
      </div>

      <div style={styles.formContainer}>
        {/* Mensajes */}
        {mensaje && (
          <div style={{
            ...styles.mensaje,
            ...(mensaje.includes('✅') ? styles.mensajeExito : 
                 mensaje.includes('❌') ? styles.mensajeError : 
                 styles.mensajeInfo)
          }}>
            {mensaje}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={styles.label}>
              Costo del Delivery (USD) *
            </label>
            <input
              type="text"
              value={costoDelivery}
              onChange={handleChange}
              onFocus={(e) => e.target.style.borderColor = '#3498db'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
              placeholder="Ej: 5.00"
              style={styles.input}
              disabled={guardando}
            />
            <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '5px' }}>
              Ingresa el costo del servicio de delivery en dólares
            </div>
          </div>
          
          {/* Botones */}
          <div style={styles.botonesContainer}>
            <button
              type="button"
              onClick={handleLimpiar}
              style={{
                ...styles.boton,
                ...styles.botonLimpiar,
                opacity: guardando ? 0.5 : 1
              }}
              disabled={guardando}
            >
              Limpiar
            </button>
            
            <button
              type="submit"
              style={{
                ...styles.boton,
                ...styles.botonGuardar,
                ...(guardando ? styles.botonDeshabilitado : {}),
                opacity: guardando ? 0.7 : 1
              }}
              disabled={guardando}
            >
              {guardando ? '💾 Guardando...' : '💾 Guardar'}
            </button>
          </div>
        </form>
      </div>

      {/* Información adicional */}
      <div style={styles.infoBox}>
        <div style={{ fontWeight: '500', marginBottom: '8px' }}>
          💡 Información:
        </div>
        <div>• El costo de delivery se almacena en la tabla "config" con clave "delivery"</div>
        <div>• Se guarda como número decimal (ej: 5.00 para $5.00 USD)</div>
        <div>• Este costo se puede usar para agregar a los totales de los pedidos</div>
        <div>• Para usarlo: <code>await db.getConfigValue('delivery')</code></div>
      </div>
    </div>
  );
};

export default Delivery;