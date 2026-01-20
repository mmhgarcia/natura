// src/lib/db/utils/deliveryUtil.js
import { db } from '../database.js';

export async function getDeliveryCost() {
  try {
    const valor = await db.getConfigValue('delivery');
    return valor ? parseFloat(valor) : 0;
  } catch (error) {
    console.error('Error obteniendo delivery desde utils:', error);
    return 0;
  }
}

export async function calcularConDelivery(subtotal, delivery = null) {
  try {
    if (!delivery) {
      delivery = await getDeliveryCost();
    }

    if (!delivery || delivery <= 0) {
      return subtotal; // Sin cargo de delivery
    }

    const total = parseFloat(subtotal) + parseFloat(delivery);
    return Math.round(total * 100) / 100;
  } catch (error) {
    console.error('Error calculando con delivery:', error);
    return subtotal;
  }
}