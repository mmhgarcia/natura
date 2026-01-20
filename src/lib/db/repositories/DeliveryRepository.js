// src/lib/db/repositories/DeliveryRepository.js
import { db } from "../database";

const DELIVERY_KEY = 'delivery';

export const DeliveryRepository = {
  async getDelivery() {
    return await db.getConfigValue(DELIVERY_KEY);
  },

  async saveDelivery(valor) {
    return await db.setConfigValue(DELIVERY_KEY, Number(valor));
  },

  async calcularTotalConDelivery(subtotal) {
    const delivery = await db.getConfigValue(DELIVERY_KEY);
    
    if (!delivery || typeof delivery !== "number") {
      console.warn("Delivery no configurado. Retornando solo subtotal.");
      return subtotal;
    }
    
    return Number(subtotal || 0) + delivery;
  }
};