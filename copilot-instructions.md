# Natura App — Contexto del Proyecto

App **PWA** para la gestión integral de una heladería (**Natura Helados**).  
Stack: **React 19 + Vite 7 + Dexie (IndexedDB) + React Router v7**.

---

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19, JSX, CSS Modules |
| Build | Vite 7 + @vitejs/plugin-react + babel-plugin-react-compiler |
| Routing | react-router-dom v7 (BrowserRouter) |
| Base de datos local | Dexie (IndexedDB) |
| Gráficos | Recharts |
| PWA | vite-plugin-pwa (autoUpdate, offline, manifest) |
| Linting | ESLint 9 con plugin react-hooks y react-refresh |
| Seguridad | Módulo WASM (C++ compilado con Emscripten) + KeyManager + SecureDexie |

---

## Estructura del proyecto

```
src/
├── App.jsx               # Routes principal
├── main.jsx              # Entry point (BrowserRouter + StrictMode)
├── components/           # Componentes reutilizables
│   ├── Header.jsx        # Header con menú hamburguesa + Sidebar
│   ├── Sidebar.jsx       # Navegación lateral
│   ├── Footer.jsx        # Footer global
│   ├── Pedidos/          # Gestión de pedidos
│   ├── FreezerLayout/    # Layout visual tipo congelador (FreezerGrid, FreezerSlot)
│   ├── GruposCRUD/       # CRUD de grupos de productos
│   ├── ProductosCRUD/    # CRUD de productos
│   ├── Panel/            # Dashboard (tasa, tendencias, hooks useGrupos, useProductos)
│   ├── ConsultaStockModal
│   ├── ConsultaVentasModal
│   ├── Delivery
│   ├── DescargarCatalogo
│   ├── GestionPedido
│   ├── RegistroGasto
│   ├── ResumenInventario
│   └── TasaImporter / TasaList
├── pages/                # Páginas del router
│   ├── Home.jsx          # Página principal (productos, voz, freezer)
│   ├── Lista.jsx         # Lista de seleccionados
│   ├── About.jsx
│   ├── Panel → Panel.jsx
│   ├── TasaBCV.jsx
│   ├── GruposPage.jsx
│   ├── ProductosPage.jsx
│   ├── DeliveryPage.jsx
│   ├── Pedidos.jsx
│   ├── Estadisticas.jsx
│   ├── SaboresMasVendidos.jsx
│   ├── NotFound.jsx
│   └── Home.jsx
├── lib/
│   ├── constants.js      # Constantes globales (ORDER_STATUS, etc.)
│   ├── utils.js          # formatDate y utilidades generales
│   └── db/               # Capa de base de datos
│       ├── database.js   # Definición de Dexie DB
│       ├── index.js      # Re-exportaciones
│       ├── hooks/        # Hooks personalizados (useDelivery, useTasa, useTasaBCV)
│       ├── repositories/ # Repositorios por entidad
│       └── utils/        # Utilidades de DB (tasaUtil, etc.)
├── finanzas/             # Módulo de finanzas
│   ├── constants.js
│   ├── cuentasService.js
│   ├── eventosService.js
│   ├── finanzasDB.js
│   ├── saldosService.js
│   ├── testFinanzas.jsx
│   └── uuid.js
├── core/finanzas/        # Lógica financiera (cálculos, cuentas, movimientos)
├── security/             # Módulo de seguridad
│   ├── wasm/security.cpp # Código C++ compilado a WASM
│   ├── js/KeyManager.js  # Gestión de claves
│   ├── js/SecureDexie.js # Dexie cifrado
│   └── js/index.js
├── data/                 # Datos estáticos (data.json, grupos.json)
├── assets/               # Recursos estáticos
├── App.css
└── index.css
```

---

## Rutas principales

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/` | `Home` | Catálogo de productos, imágenes, filtro por grupo, voz, FreezerLayout |
| `/lista` | `Lista` | Lista de productos seleccionados |
| `/panel` | `Panel` | Dashboard con tasas, tendencias, grupos y productos |
| `/tasabcv` | `TasaBCV` | Consultar tasa BCV |
| `/delivery` | `DeliveryPage` | Gestión de delivery |
| `/pedidos` | `PedidosPage` | Gestión de pedidos |
| `/estadisticas` | `Estadisticas` | Estadísticas de ventas |
| `/sabores-mas-vendidos` | `SaboresMasVendidos` | Top sabores más vendidos |
| `/resumeninventario` | `ResumenInventario` | Resumen de inventario |
| `/registrogasto` | `RegistroGasto` | Registro de gastos |
| `/freezergrid` | `FreezerGrid` | Grid visual del congelador |
| `/admingrupos` | `GruposPage` | CRUD de grupos |
| `/adminproductos` | `ProductosPage` | CRUD de productos |
| `/testfinanzas` | `TestFinanzas` | Pruebas del módulo finanzas |

---

## Convenciones y reglas

### Código
- **React con JSX** funcional, hooks, CSS Modules (`*.module.css`)
- ** imports sin extensión** para archivos locales (ej: `from './Home'`)
- Las importaciones de la DB van con ruta completa: `from '../lib/db/database.js'`
- `formatDate()` en `lib/utils.js` — evita usar `new Date()` directo para evitar problemas de zona horaria

### Base de datos
- **Dexie** es la capa de datos local (IndexedDB)
- Los repositorios encapsulan operaciones por entidad
- Hook personalizados para acceso reactivo a datos (`useDelivery`, `useTasa`, etc.)

### Voz (Speech Recognition)
- El parseo de comandos de voz está en `Home.jsx`
- Hay un plan documentado en `docs/planParseoAudio.md` para mejorarlo (scoring Jaccard + Levenshtein, ranking, desambiguación, máxima flexibilidad gramatical)

### Finanzas
- Módulo separado en `src/finanzas/` con servicios (cuentas, eventos, saldos)
- Tests en `testFinanzas.jsx`

### Seguridad
- WASM compilado con Emscripten desde `src/security/wasm/security.cpp`
- Script de build: `npm run build:wasm`
- KeyManager y SecureDexie para cifrado en IndexedDB

### PWA
- Registro tipo `autoUpdate`
- Iconos: `pwa-192x192.png`, `pwa-512x512.png`
- Favicon, `apple-touch-icon.png`, `mask-icon.svg`

---

## Comandos comunes

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Iniciar servidor de desarrollo Vite |
| `npm run build` | Build de producción |
| `npm run build:wasm` | Compilar módulo WASM de seguridad |
| `npm run lint` | ESLint |
| `npm run preview` | Preview del build |
| `npm run test` | Tests (si se configuran) |

> ⚠️ **WSL**: En `/mnt/d` Vite a veces no detecta cambios — reiniciar el dev server si ocurre.

---

## Mejoras planificadas (voice parsing)

Ver `docs/planParseoAudio.md` para el plan detallado de fortalecimiento del reconocimiento de voz:
1. Extraer matching a utilitario (`src/utils/matchProducto.js`)
2. Scoring combinado (Jaccard + Levenshtein + prefix bonus)
3. Ranking y desempate con umbral
4. Gramática más flexible (múltiples órdenes, cantidad implícita)
5. Aprovechar `maxAlternatives` del SpeechRecognition
6. Reusar matcher en `procesarConsulta`
7. Tests unitarios
