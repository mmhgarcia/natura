import Dexie from 'dexie';

export const finanzasDB = new Dexie('natura_finanzas_db');

finanzasDB.version(1).stores({
  cuentas: 'id, nombre, tipo, moneda_base, activa',
  eventosEconomicos: 'id, fecha, tipo, cuenta_id, origen'
});

