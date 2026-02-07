import { useState } from 'react';
import { finanzasDB } from './finanzasDB';
import { crearCuenta, listarCuentas } from './cuentasService';
import { crearEventoEconomico } from './eventosService';
import { EVENTO_TIPO } from './constants';

export default function TestFinanzas() {
  const [saldoCaja, setSaldoCaja] = useState('');
  const [saldoBanco, setSaldoBanco] = useState('');

  // --------------------------------------------------
  // Bootstrap financiero: limpiar y crear cuentas
  // --------------------------------------------------
  const ejecutarTest = async () => {
    console.clear();
    console.log('=== TEST FINANZAS NATURA (BOOTSTRAP) ===');

    try {
      console.log('[1] abriendo DB...');
      await finanzasDB.open();
      console.log('[OK] DB finanzas abierta');

      console.log('[2] limpiando tablas de finanzas...');
      await finanzasDB.eventos.clear();
      await finanzasDB.cuentas.clear();
      console.log('[OK] tablas limpiadas');

      console.log('[3] creando cuentas base...');
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
      console.log('[OK] cuentas creadas:', cuentas);

      console.log('=== BOOTSTRAP FINALIZADO ===');

    } catch (err) {
      console.error('[ERROR TEST FINANZAS]', err);
    }
  };

  // --------------------------------------------------
  // Carga manual de saldos iniciales (one-shot)
  // --------------------------------------------------
  const cargarSaldosIniciales = async () => {
    try {
      const cuentas = await listarCuentas();
      const caja = cuentas.find(c => c.nombre === 'Caja');
      const banco = cuentas.find(c => c.nombre === 'Banco');

      if (!caja || !banco) {
        console.warn('[WARN] Cuentas no existen. Ejecuta primero el bootstrap.');
        return;
      }

      if (Number(saldoCaja) > 0) {
        await crearEventoEconomico({
          tipo:  EVENTO_TIPO.INGRESO,
          monto: Number(saldoCaja),
          moneda: 'USD',
          cuenta_id: caja.id,
          origen: 'saldo_inicial',
          descripcion: 'Saldo inicial de Caja'
        });
      }

      if (Number(saldoBanco) > 0) {
        await crearEventoEconomico({
          tipo: EVENTO_TIPO.INGRESO,
          monto: Number(saldoBanco),
          moneda: 'USD',
          cuenta_id: banco.id,
          origen: 'saldo_inicial',
          descripcion: 'Saldo inicial de Banco'
        });
      }

      console.log('[OK] Saldos iniciales cargados');

    } catch (err) {
      console.error('[ERROR CARGA SALDOS]', err);
    }
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------
  return (
    <div style={{ padding: 16 }}>
      <h2>Test Finanzas (diagnóstico)</h2>

      <button onClick={ejecutarTest}>
        Inicializar sistema financiero
      </button>

      <p style={{ marginTop: 8 }}>
        Limpia DB de finanzas y crea cuentas base (Caja / Banco).
      </p>

      <hr />

      <h3>Carga de saldos iniciales (one-shot)</h3>

      <div>
        <label>Saldo inicial Caja (USD)</label>
        <br />
        <input
          type="number"
          value={saldoCaja}
          onChange={e => setSaldoCaja(e.target.value)}
        />
      </div>

      <br />

      <div>
        <label>Saldo inicial Banco (USD)</label>
        <br />
        <input
          type="number"
          value={saldoBanco}
          onChange={e => setSaldoBanco(e.target.value)}
        />
      </div>

      <br />

      <button onClick={cargarSaldosIniciales}>
        Cargar saldos iniciales
      </button>
    </div>
  );
}
