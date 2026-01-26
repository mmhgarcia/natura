/**
 * Servicio de migración para convertir pedidos al formato detallado de BI.
 * Realiza una captura de precios y costos actuales para pedidos antiguos.
 */
import { db } from '../database';

export const migrateOrdersToBI = async () => {
  try {
    // 1. Obtener toda la data necesaria en paralelo para optimizar rendimiento
    const [allOrders, allProducts, allGroups] = await Promise.all([
      db.getAll('pedidos'),
      db.getAll('productos'),
      db.getAll('grupos')
    ]);

    // 2. Filtrar pedidos que aún tienen el formato antiguo (items no es un Array)
    const ordersToMigrate = allOrders.filter(p => p.items && !Array.isArray(p.items));

    if (ordersToMigrate.length === 0) {
      return { success: true, migratedCount: 0, message: "No hay pedidos pendientes por migrar." };
    }

    let count = 0;

    for (const pedido of ordersToMigrate) {
      // 3. Lógica de Transformación de Items
      const itemsBI = Object.entries(pedido.items).map(([prodId, qty]) => {
        const prod = allProducts.find(p => p.id === parseInt(prodId));
        // Buscamos el grupo ignorando mayúsculas/minúsculas para mayor seguridad
        const grupo = prod 
          ? allGroups.find(g => g.nombre.toLowerCase() === prod.grupo.toLowerCase()) 
          : null;

        const precioUnit = grupo?.precio || 0;
        const costoUnit = grupo?.costo_$ || 0;

        return {
          productoId: parseInt(prodId),
          nombre: prod?.nombre || "Producto no encontrado",
          grupo: prod?.grupo || "Otros",
          cantidad: qty,
          precioUnitario: precioUnit,
          costoUnitario: costoUnit,
          subtotalUsd: qty * precioUnit,
          utilidadUsd: qty * (precioUnit - costoUnit)
        };
      });

      // 4. Recalcular totales para asegurar consistencia BI
      const subtotalVentaUsd = itemsBI.reduce((sum, item) => sum + item.subtotalUsd, 0);
      const costoEnvio = pedido.delivery_aplicado ? (parseFloat(pedido.delivery_tasa) || 0) : 0;
      
      const nuevoTotalUsd = subtotalVentaUsd + costoEnvio;
      const tasaActual = parseFloat(pedido.tasa) || 0;

      // 5. Preparar objeto migrado
      const pedidoMigrado = {
        ...pedido,
        items: itemsBI, // Reemplazamos el diccionario por el Array BI
        total_usd: nuevoTotalUsd,
        total_bs: nuevoTotalUsd * tasaActual,
        updatedAt: new Date().toISOString(),
        migratedAt: new Date().toISOString() // Marca de auditoría
      };

      // 6. Actualización Masiva (Registro por registro para seguridad en IndexedDB)
      await db.put('pedidos', pedidoMigrado);
      count++;
    }

    return { 
      success: true, 
      migratedCount: count, 
      message: `Se migraron ${count} pedidos exitosamente al formato BI.` 
    };

  } catch (error) {
    console.error("Error en la migración de pedidos:", error);
    return { success: false, error: error.message };
  }
};