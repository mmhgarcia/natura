import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db/database';

/** Convierte un string con coma o punto a número. Devuelve 0 si no es válido. */
const parseNum = (val) => parseFloat(String(val).replace(',', '.')) || 0;

/* ─── Estilos inyectados una sola vez ─────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  .mg-overlay {
    position: fixed; inset: 0;
    background: rgba(10, 14, 26, 0.72);
    backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    z-index: 3000;
    animation: mgFadeIn .18s ease;
  }
  @keyframes mgFadeIn { from { opacity: 0 } to { opacity: 1 } }

  .mg-modal {
    font-family: 'Inter', sans-serif;
    background: #ffffff;
    border-radius: 16px;
    width: 92%; max-width: 420px;
    max-height: 92vh; overflow-y: auto;
    box-shadow: 0 24px 64px rgba(0,0,0,.28);
    animation: mgSlideUp .22s cubic-bezier(.34,1.56,.64,1);
    overflow: hidden;
  }
  @keyframes mgSlideUp { from { transform: translateY(28px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }

  /* Header */
  .mg-header {
    background: linear-gradient(135deg, #1a7a4a 0%, #22a86b 100%);
    padding: 22px 24px 18px;
    position: relative;
  }
  .mg-header-icon {
    width: 40px; height: 40px;
    background: rgba(255,255,255,.18);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; margin-bottom: 10px;
  }
  .mg-title {
    margin: 0; font-size: 18px; font-weight: 700;
    color: #fff; letter-spacing: .3px;
  }
  .mg-subtitle {
    margin: 2px 0 0; font-size: 12px;
    color: rgba(255,255,255,.7); font-weight: 400;
  }
  .mg-close-btn {
    position: absolute; top: 14px; right: 14px;
    background: rgba(255,255,255,.15); border: none;
    color: #fff; width: 30px; height: 30px;
    border-radius: 50%; cursor: pointer; font-size: 16px;
    display: flex; align-items: center; justify-content: center;
    transition: background .15s;
  }
  .mg-close-btn:hover { background: rgba(255,255,255,.3); }

  /* Body */
  .mg-body { padding: 22px 24px 24px; }

  /* Campo */
  .mg-field { margin-bottom: 16px; }
  .mg-label {
    display: flex; align-items: center; gap: 6px;
    font-size: 12px; font-weight: 600;
    color: #6b7280; text-transform: uppercase;
    letter-spacing: .6px; margin-bottom: 6px;
  }
  .mg-label-icon { font-size: 13px; }
  .mg-input-wrap { position: relative; }
  .mg-input-prefix {
    position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
    font-size: 13px; font-weight: 600; color: #9ca3af; pointer-events: none;
  }
  .mg-input {
    width: 100%; box-sizing: border-box;
    border: 1.5px solid #e5e7eb;
    border-radius: 10px;
    padding: 10px 12px 10px 28px;
    font-size: 15px; font-weight: 500; color: #111827;
    background: #f9fafb;
    transition: border-color .15s, box-shadow .15s, background .15s;
    outline: none;
    font-family: 'Inter', sans-serif;
  }
  .mg-input:focus {
    border-color: #22a86b;
    background: #fff;
    box-shadow: 0 0 0 3px rgba(34,168,107,.12);
  }
  .mg-input.no-prefix { padding-left: 12px; }
  .mg-input.readonly {
    background: #f3f4f6; color: #9ca3af;
    cursor: not-allowed; border-color: #e5e7eb;
  }
  .mg-input::placeholder { color: #c4c9d4; font-weight: 400; }

  /* Badge auto-calculado */
  .mg-badge-auto {
    display: inline-flex; align-items: center; gap: 3px;
    background: #dcfce7; color: #15803d;
    font-size: 10px; font-weight: 600;
    padding: 2px 8px; border-radius: 20px;
    letter-spacing: .3px; margin-left: 6px;
    text-transform: none;
  }

  /* Separador */
  .mg-divider {
    height: 1px; background: #f3f4f6; margin: 6px 0 16px;
  }

  /* Hint */
  .mg-hint {
    font-size: 11px; color: #9ca3af; margin-top: 4px;
    display: flex; align-items: center; gap: 4px;
  }

  /* Botones */
  .mg-footer {
    display: flex; gap: 10px; margin-top: 24px;
  }
  .mg-btn {
    flex: 1; padding: 12px;
    border: none; border-radius: 10px;
    font-size: 14px; font-weight: 600;
    cursor: pointer; font-family: 'Inter', sans-serif;
    transition: transform .12s, box-shadow .12s, filter .12s;
  }
  .mg-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,.15); }
  .mg-btn:active { transform: translateY(0); }
  .mg-btn-save {
    background: linear-gradient(135deg, #1a7a4a, #22a86b);
    color: #fff;
    box-shadow: 0 2px 8px rgba(34,168,107,.35);
  }
  .mg-btn-cancel {
    background: #f3f4f6; color: #6b7280;
  }
  .mg-btn-cancel:hover { background: #e5e7eb; }
`;

let styleInjected = false;
const injectStyles = () => {
  if (styleInjected) return;
  const tag = document.createElement('style');
  tag.textContent = CSS;
  document.head.appendChild(tag);
  styleInjected = true;
};

/* ─── Componente ───────────────────────────────────────────────────────────── */
const ModalGrupo = ({ grupo, onClose, onSave }) => {
  injectStyles();

  const [formData, setFormData] = useState({
    nombre: '',
    precio: '',
    costo_$: '',
    margen: ''
  });

  useEffect(() => {
    if (grupo) {
      setFormData({
        nombre: grupo.nombre || '',
        precio: grupo.precio !== undefined ? String(grupo.precio) : '',
        costo_$: grupo.costo_$ !== undefined ? String(grupo.costo_$) : '',
        margen: grupo.margen !== undefined && grupo.margen !== null && grupo.margen !== 0
          ? String(grupo.margen)
          : ''
      });
    }
  }, [grupo]);

  const calcularPrecio = (costo, margen) => {
    const m = parseNum(margen);
    if (!margen || margen.toString().trim() === '' || m <= 0) return null;
    return (parseNum(costo) * (1 + m / 100)).toFixed(2);
  };

  const handleCostoChange = (e) => {
    const val = e.target.value;
    const nuevoPrecio = calcularPrecio(val, formData.margen);
    setFormData(prev => ({
      ...prev,
      costo_$: val,
      ...(nuevoPrecio !== null ? { precio: nuevoPrecio } : {})
    }));
  };

  const handleMargenChange = (e) => {
    const val = e.target.value;
    const nuevoPrecio = calcularPrecio(formData.costo_$, val);
    setFormData(prev => ({
      ...prev,
      margen: val,
      ...(nuevoPrecio !== null ? { precio: nuevoPrecio } : {})
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSave = {
      nombre: formData.nombre,
      precio: parseNum(formData.precio),
      costo_$: parseNum(formData.costo_$),
      margen: formData.margen.toString().trim() !== '' ? parseNum(formData.margen) : 0
    };
    try {
      if (grupo) {
        await db.put('grupos', { ...grupo, ...dataToSave });
      } else {
        await db.add('grupos', dataToSave);
      }
      onSave();
      onClose();
    } catch (err) {
      alert('Error al guardar: ' + err.message);
    }
  };

  const margenActivo = formData.margen.toString().trim() !== '' && parseNum(formData.margen) > 0;
  const esEdicion = !!grupo;

  return (
    <div className="mg-overlay" onClick={(e) => e.target.className === 'mg-overlay' && onClose()}>
      <div className="mg-modal">

        {/* ── Header ── */}
        <div className="mg-header">
          <div className="mg-header-icon">🏷️</div>
          <h2 className="mg-title">{esEdicion ? 'Editar Grupo' : 'Nuevo Grupo'}</h2>
          <p className="mg-subtitle">
            {esEdicion ? `Modificando: ${grupo.nombre}` : 'Completa los datos del nuevo grupo'}
          </p>
          <button className="mg-close-btn" type="button" onClick={onClose}>✕</button>
        </div>

        {/* ── Body ── */}
        <div className="mg-body">
          <form onSubmit={handleSubmit}>

            {/* Nombre */}
            <div className="mg-field">
              <div className="mg-label">
                <span className="mg-label-icon">📝</span> Nombre del grupo
              </div>
              <div className="mg-input-wrap">
                <input
                  className="mg-input no-prefix"
                  type="text"
                  placeholder="Ej: Crema Facial, Set Corporal…"
                  value={formData.nombre}
                  onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="mg-divider" />

            {/* Costo */}
            <div className="mg-field">
              <div className="mg-label">
                <span className="mg-label-icon">💲</span> Costo
              </div>
              <div className="mg-input-wrap">
                <span className="mg-input-prefix">$</span>
                <input
                  className="mg-input"
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={formData.costo_$}
                  onChange={handleCostoChange}
                />
              </div>
            </div>

            {/* Margen */}
            <div className="mg-field">
              <div className="mg-label">
                <span className="mg-label-icon">📈</span> Margen
              </div>
              <div className="mg-input-wrap">
                <span className="mg-input-prefix">%</span>
                <input
                  className="mg-input"
                  type="text"
                  inputMode="decimal"
                  placeholder="Ej: 40,00"
                  value={formData.margen}
                  onChange={handleMargenChange}
                />
              </div>
              {margenActivo && (
                <div className="mg-hint">
                  ⚡ El precio se calcula automáticamente al cambiar costo o margen
                </div>
              )}
            </div>

            {/* Precio */}
            <div className="mg-field">
              <div className="mg-label">
                <span className="mg-label-icon">🏷️</span> Precio de venta
                {margenActivo && (
                  <span className="mg-badge-auto">✦ Auto</span>
                )}
              </div>
              <div className="mg-input-wrap">
                <span className="mg-input-prefix">$</span>
                <input
                  className={`mg-input${margenActivo ? ' readonly' : ''}`}
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={formData.precio}
                  onChange={e => setFormData({ ...formData, precio: e.target.value })}
                  readOnly={margenActivo}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="mg-footer">
              <button type="button" className="mg-btn mg-btn-cancel" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="mg-btn mg-btn-save">
                {esEdicion ? '💾 Actualizar' : '✅ Crear Grupo'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default ModalGrupo;