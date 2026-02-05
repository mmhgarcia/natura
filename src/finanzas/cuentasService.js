import { finanzasDB } from './finanzasDB';
import { generarUUID } from './uuid';

export async function crearCuenta(data) {
  const cuenta = {
    id: generarUUID(),
    nombre: data.nombre,
    tipo: data.tipo,
    moneda_base: data.moneda_base,
    activa: true
  };

  await finanzasDB.cuentas.add(cuenta);
  return cuenta;
}

export async function listarCuentas() {
  return await finanzasDB.cuentas.toArray();
}

export async function desactivarCuenta(id) {
  await finanzasDB.cuentas.update(id, { activa: false });
}

