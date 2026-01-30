import { movimientos } from './movimientos.js'

export function registrarMovimiento({
  fecha = new Date(),
  tipo, // 'ingreso' | 'egreso'
  monto,
  cuentaId,
  origen,       // 'venta' | 'gasto'
  referenciaId, // id de venta o gasto
  descripcion = ''
}) {
  if (!tipo || !monto || !cuentaId) {
    throw new Error('Movimiento incompleto')
  }

  const movimiento = {
    id: crypto.randomUUID(),
    fecha,
    tipo,
    monto,
    cuentaId,
    origen,
    referenciaId,
    descripcion
  }

  movimientos.push(movimiento)
  return movimiento
}
