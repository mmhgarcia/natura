import { finanzasDB } from './finanzasDB';
import { generarUUID } from './uuid';

export async function crearEventoEconomico(evento) {
  return finanzasDB.eventosEconomicos.add({
    id: generarUUID(),
    fecha: evento.fecha || new Date().toISOString(),
    tipo: evento.tipo,                 // 'ingreso' | 'salida'
    monto: evento.monto,
    moneda: evento.moneda,             // 'USD' | 'BS'
    tasa_bcv_usada: evento.tasa_bcv_usada || null,
    cuenta_id: evento.cuenta_id,
    origen: evento.origen,             // 'venta' | 'compra' | 'gasto' | 'retiro'
    referencia_id: evento.referencia_id || null,
    descripcion: evento.descripcion || ''
  });
}

export async function listarEventos() {
  return finanzasDB.eventosEconomicos
    .orderBy('fecha')
    .reverse()
    .toArray();
}

export async function listarEventosPorCuenta(cuenta_id) {
  return finanzasDB.eventosEconomicos
    .where('cuenta_id')
    .equals(cuenta_id)
    .toArray();
}
