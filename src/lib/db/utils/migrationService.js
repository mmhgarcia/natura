/**
 * Servicio de migración para convertir pedidos al formato detallado de BI.
 * Realiza una captura de precios y costos actuales para pedidos antiguos.
 */
import { db } from '../database';

/**
 * Migra las ventas antiguas al formato BI agregando costos y utilidad.
 */
export const migrateSalesToBI = async () => {
  try {
    // 1. Obtener datos necesarios en paralelo
    const [allSales, allGroups] = await Promise.all([
      db.getAll('ventas'),
      db.getAll('grupos')
    ]);

    // 2. Filtrar ventas que no tienen snapshot financiero (falta costoUnitarioUsd)
    const salesToMigrate = allSales.filter(v => v.costoUnitarioUsd === undefined);

    if (salesToMigrate.length === 0) {
      return { success: true, migratedCount: 0, message: "No hay ventas pendientes por migrar." };
    }

    let count = 0;
    for (const venta of salesToMigrate) {
      // 3. Buscar el costo actual del grupo al que pertenece el producto
      const grupo = allGroups.find(g => g.nombre.toLowerCase() === venta.grupo.toLowerCase());

      const costoUnit = grupo?.costo_$ || 0;
      const precioVenta = venta.precioUsd || 0;

      // 4. Preparar el objeto con el Snapshot Financiero retroactivo
      const ventaMigrada = {
        ...venta,
        costoUnitarioUsd: costoUnit,
        utilidadUsd: precioVenta - costoUnit,
        // Si no tiene tasaVenta (ventas muy viejas), podrías asignar 0 o buscar la tasa de esa fecha
        tasaVenta: venta.tasaVenta || 0,
        migratedAt: new Date().toISOString() // Marca de auditoría
      };

      // 5. Guardar registro actualizado
      await db.put('ventas', ventaMigrada);
      count++;
    }

    return {
      success: true,
      migratedCount: count,
      message: `Se normalizaron ${count} registros de ventas para análisis de BI.`
    };

  } catch (error) {
    console.error("Error en la migración de ventas:", error);
    return { success: false, error: error.message };
  }
};


export const migrateOrdersToBI = async () => {
  try {
    // 1. Obtener toda la data necesaria en paralelo para optimizar rendimiento
    const [allOrders, allProducts, allGroups] = await Promise.all([
      db.getAll('pedidos'),
      db.getAll('productos'),
      db.getAll('grupos')
    ]);

    // 2. Filtrar pedidos que aún tienen el formato antiguo (items no es un Array) 
    // MODIFICACIÓN: Ahora permitimos migrar todos para corregir discrepancias de cálculos anteriores
    const ordersToMigrate = allOrders; // Procesamos todos los pedidos para asegurar consistencia

    if (ordersToMigrate.length === 0) {
      return { success: true, migratedCount: 0, message: "No hay pedidos pendientes por migrar." };
    }

    let count = 0;

    for (const pedido of ordersToMigrate) {
      // 3. Lógica de Transformación de Items (Maneja tanto Formato Antiguo como BI)
      const itemsSnapshot = Array.isArray(pedido.items)
        ? pedido.items
        : Object.entries(pedido.items || {}).map(([id, qty]) => ({ productoId: parseInt(id), cantidad: qty }));

      const itemsBI = itemsSnapshot.map((item) => {
        const prodId = item.productoId;
        const qty = item.cantidad;
        const prod = allProducts.find(p => p.id === prodId);
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
      const subtotalCostoUsd = itemsBI.reduce((sum, item) => sum + (item.cantidad * item.costoUnitario), 0);
      const subtotalVentaUsd = itemsBI.reduce((sum, item) => sum + item.subtotalUsd, 0);
      const costoEnvio = pedido.delivery_aplicado ? (parseFloat(pedido.delivery_tasa) || 0) : 0;

      const totalInversionUsd = subtotalCostoUsd + costoEnvio;
      const totalVentaUsd = subtotalVentaUsd; // La venta no suele incluir el delivery pagado al proveedor
      const tasaActual = parseFloat(pedido.tasa) || 0;

      // 5. Preparar objeto migrado
      const pedidoMigrado = {
        ...pedido,
        items: itemsBI,
        total_usd: totalInversionUsd, // Ahora es Costo + Delivery
        total_bs: totalInversionUsd * tasaActual,
        venta_usd: totalVentaUsd,
        venta_bs: totalVentaUsd * tasaActual,
        utilidad_usd: totalVentaUsd - totalInversionUsd,
        utilidad_bs: (totalVentaUsd - totalInversionUsd) * tasaActual,
        updatedAt: new Date().toISOString(),
        migratedAt: new Date().toISOString()
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