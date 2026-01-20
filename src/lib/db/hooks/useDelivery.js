// src/lib/db/hooks/useDelivery.js
import { useState, useEffect } from 'react';
import { db } from '../database.js';

export function useDelivery() {
  const [delivery, setDelivery] = useState(0);
  const [loading, setLoading] = useState(true);

  // Cargar delivery al inicio
  useEffect(() => {
    async function loadDelivery() {
      try {
        // Buscar en la tabla 'config' donde clave = 'delivery'
        const config = await db.config.get('delivery');
        
        if (config && config.valor) {
          const valor = String(config.valor).replace(',', '.');
          setDelivery(valor);
        } else {
          setDelivery('0'); // Cero si no existe
        }
      } catch (error) {
        console.error('Error cargando delivery:', error);
        setDelivery('0');
      } finally {
        setLoading(false);
      }
    }

    loadDelivery();
  }, []);

  // Guardar delivery
  const saveDelivery = async (valor) => {
    try {
      const deliveryNormalizado = String(valor).replace(',', '.');
      const deliveryNumero = parseFloat(deliveryNormalizado);
      
      if (isNaN(deliveryNumero)) {
        console.error('Valor no es un número:', valor);
        return false;
      }

      await db.config.put({
        clave: 'delivery',
        valor: deliveryNumero,
        fechaActualizacion: new Date(),
        tipo: 'decimal'
      });

      console.log('Delivery guardado:', deliveryNumero);
      setDelivery(deliveryNormalizado);
      return true;

    } catch (error) {
      console.error('Error guardando delivery:', error);
      return false;
    }
  };

  return {
    delivery,
    setDelivery,
    saveDelivery,
    loading
  };
}