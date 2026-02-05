import { finanzasDB } from './finanzasDB';
import { listarCuentas } from './cuentasService';
//import { calcularSaldoCuenta } from './saldosService';

/**
 * Retorna todos los eventos económicos asociados a una cuenta
 */
export async function obtenerEventosPorCuenta(cuentaId) {
  return await finanzasDB.eventosEconomicos
    .where('cuenta_id')
    .equals(cuentaId)
    .toArray();
}


/**
 * Calcula el saldo de una cuenta a partir de sus eventos
 * Retorna un objeto por moneda
 *
 * Ejemplo:
 * { USD: 120, BS: -30 }
 */
export async function calcularSaldoCuenta(cuentaId) {
  const eventos = await obtenerEventosPorCuenta(cuentaId);

  const saldos = {};

  for (const ev of eventos) {
    const moneda = ev.moneda || 'USD';

    if (!saldos[moneda]) {
      saldos[moneda] = 0;
    }

    if (ev.tipo === 'ingreso') {
      saldos[moneda] += ev.monto;
    }

    if (ev.tipo === 'egreso') {
      saldos[moneda] -= ev.monto;
    }
  }

  return saldos;
}


/**
 * Calcula el saldo consolidado de todas las cuentas
 *
 * Ejemplo:
 * { USD: 120, BS: -30 }
 */
export async function calcularSaldoConsolidado() {
  const cuentas = await listarCuentas();

  const consolidado = {};

  for (const cuenta of cuentas) {
    const saldoCuenta = await calcularSaldoCuenta(cuenta.id);

    for (const moneda in saldoCuenta) {
      if (!consolidado[moneda]) {
        consolidado[moneda] = 0;
      }
      consolidado[moneda] += saldoCuenta[moneda];
    }
  }

  return consolidado;
}