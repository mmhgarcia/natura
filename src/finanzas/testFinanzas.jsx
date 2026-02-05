import { finanzasDB } from './finanzasDB';
import { crearCuenta, listarCuentas } from './cuentasService';
import { crearEventoEconomico, listarEventos } from './eventosService';

export default function TestFinanzas() {

  const ejecutarTest = async () => {
    console.clear();
    console.log('=== TEST FINANZAS NATURA ===');

    try {
      console.log('[1] abriendo DB...');
      await finanzasDB.open();
      console.log('[OK] DB finanzas abierta');

      console.log('[2] creando cuentas...');
      await crearCuenta({
        nombre: 'Caja',
        tipo: 'caja',
        moneda_base: 'USD'
      });

      await crearCuenta({
        nombre: 'Banco',
        tipo: 'banco',
        moneda_base: 'USD'
      });

      const cuentas = await listarCuentas();
      console.log('[OK] cuentas:', cuentas);

      const caja = cuentas.find(c => c.nombre === 'Caja');

      console.log('[3] registrando ingreso db finanzas ...');
      await crearEventoEconomico({
        tipo: 'ingreso',
        monto: 10,
        moneda: 'USD',
        cuenta_id: caja.id,
        origen: 'test',
        descripcion: 'Ingreso de prueba'
      });

      const eventos = await listarEventos();
      console.log('[OK] eventos:', eventos);

      console.log('=== TEST FINALIZADO ===');

    } catch (err) {
      console.error('[ERROR TEST FINANZAS]', err);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Test Finanzas (diagnóstico)</h2>
      <button onClick={ejecutarTest}>
        Ejecutar test de finanzas
      </button>
      <p style={{ marginTop: 8 }}>
        Ver resultados en la consola del navegador.
      </p>
    </div>
  );
}
