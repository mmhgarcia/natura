import { useState } from 'react';
import { finanzasDB } from './finanzasDB';
import { crearCuenta, listarCuentas } from './cuentasService';
import { crearEventoEconomico, listarEventos } from './eventosService';
import { calcularSaldoCuenta } from './saldosService';
import { calcularSaldoConsolidado } from './saldosService';

export default function TestFinanzas() {

  const [saldoCaja, setSaldoCaja] = useState('');
  const [saldoBanco, setSaldoBanco] = useState('');

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

      // nuevo
      console.log('[4] registrando gasto operativo...');
      await crearEventoEconomico({
        tipo: 'egreso',
        monto: 3,
        moneda: 'USD',
        cuenta_id: caja.id,
        origen: 'gasto',
        categoria: 'servicios',
        descripcion: 'Pago de electricidad'
      });

      console.log('[5] registrando retiro personal...');
      await crearEventoEconomico({
        tipo: 'egreso',
        monto: 2,
        moneda: 'USD',
        cuenta_id: caja.id,
        origen: 'retiro',
        categoria: 'personal',
        descripcion: 'Retiro personal'
      });

      const eventos = await listarEventos();
      console.log('[OK] eventos:', eventos);

      // 🔹 NUEVO PASO: saldo derivado
      //const saldoCaja = await calcularSaldoCuenta(caja.id);
      //console.log('[OK] saldo Caja:', saldoCaja);

      //const saldoTotal = await calcularSaldoConsolidado();
      //console.log('[OK] saldo consolidado:', saldoTotal);

      const saldoCaja = await calcularSaldoCuenta(caja.id);
      console.log('[OK] saldo Caja post-egresos:', saldoCaja);

      const saldoTotal = await calcularSaldoConsolidado();
      console.log('[OK] saldo consolidado post-egresos:', saldoTotal);

      console.log('=== TEST FINALIZADO ===');

    } catch (err) {
      console.error('[ERROR TEST FINANZAS]', err);
    }
  };

// -----carga de saldos iniciales
const cargarSaldosIniciales = async () => {
  const cuentas = await listarCuentas();
  const caja = cuentas.find(c => c.nombre === 'Caja');
  const banco = cuentas.find(c => c.nombre === 'Banco');

  if (saldoCaja > 0) {
    await crearEventoEconomico({
      tipo: 'ingreso',
      monto: Number(saldoCaja),
      moneda: 'USD',
      cuenta_id: caja.id,
      origen: 'saldo_inicial',
      descripcion: 'Saldo inicial de caja'
    });
  }

  if (saldoBanco > 0) {
    await crearEventoEconomico({
      tipo: 'ingreso',
      monto: Number(saldoBanco),
      moneda: 'USD',
      cuenta_id: banco.id,
      origen: 'saldo_inicial',
      descripcion: 'Saldo inicial de banco'
    });
  }

  console.log('[OK] Saldos iniciales cargados');
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
      
      <br/>
    
    <div>
  
    <label>Saldo inicial Caja (USD)</label>
    <input
      type="number"
      value={saldoCaja}
      onChange={e => setSaldoCaja(e.target.value)}
    />
  </div>
  <br/>
    <div>
      <label>Saldo inicial Banco (USD)</label>
      <input
        type="number"
        value={saldoBanco}
        onChange={e => setSaldoBanco(e.target.value)}
  />
</div>
      <button onClick={cargarSaldosIniciales}>
        Cargar saldos iniciales (one-shot)
      </button>
    </div>
  );

}


