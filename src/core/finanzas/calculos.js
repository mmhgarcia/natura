import { movimientos } from './movimientos.js'
import { cuentas } from './cuentas.js'

export function calcularSaldoCuenta(cuentaId) {
  const cuenta = cuentas.find(c => c.id === cuentaId)
  if (!cuenta) return 0

  const saldoMov = movimientos.reduce((acc, m) => {
    if (m.cuentaId !== cuentaId) return acc
    return m.tipo === 'ingreso'
      ? acc + m.monto
      : acc - m.monto
  }, 0)

  return cuenta.saldoInicial + saldoMov
}
