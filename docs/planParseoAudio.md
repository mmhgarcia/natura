# Plan para fortalecer el parseo de comandos de voz

## Debilidades actuales (`procesarComandoVoz` + `procesarConsulta`)
1. **Match bidireccional por subcadena**: `pNorm.includes(s) || s.includes(pNorm)` — "choco" matchea tanto "Choco Oreo" como "Choco Leche" y gana el primero del array; "vainilla" matchea "Vainilla Chips" y "Vainilla Frutas". Genera falsos positivos silenciosos.
2. **Sin ranking**: `productos.find()` devuelve el primero que cumple, sin score ni desempate.
3. **Regex frágil**: exige cantidad primero; "vainilla" (cantidad implícita 1) o "2 de vainilla" no parsean.
4. **Sin tolerancia a errores del STT** (malas transcripciones tipo "vainiya", "chocoreo", "talvianda"/"dalmata").
5. **`maxAlternatives=1`** desperdicia la lista de hipótesis que da el SpeechRecognition.
6. **Falla silenciosa**: si no matchea, no avisa nada (`nuevosItems` queda vacío y se ignora).
7. **`procesarConsulta`** reutiliza el mismo match débil.

## Fases

### Fase 1 — Extraer a utilitario (`src/utils/matchProducto.js`)
- `normalizeToken`, `tokenize`, `similitud(texto, producto)`.
- Reutilizable por `Home.jsx` y por futuros tests.

### Fase 2 — Scoring combinado (reemplaza `includes`)
- **Jaccard** sobre tokens de palabras (`intersection / union`) → capta "choco oreo" vs "choco leche".
- **Levenshtein normalizada** por token contra cada token del producto → tolerancia a transcripciones erradas ("vainiya"≈"vainilla").
- **Bonus de prefijo** si un token inicia igual (captura abreviaciones: "choc"→"choco").
- Score = `0.6·jaccard + 0.4·levenshtein + 0.1·prefixBonus`. Umbral ≈ 0.45.

### Fase 3 — Ranking y desempate
- Ordenar candidatos por score descendente.
- Empate → gana mayor stock (y luego alfabético).
- Si hay 2 candidatos dentro de Δ < 0.1 → mostrar **toast de desambiguación**: "¿Choco Oreo o Choco Leche? toca uno" → agrega a la lista. (UX mínima sin romper el flujo.)
- Si score < umbral → toast "No reconocí «X». ¿Decías: …sugerencias…?" (top‑3 por similitud).

### Fase 4 — Gramática más flexible
- Permitir múltiples órdenes: `<qty> <prod>`, `<prod> <qty>`, `<prod>` (qty=1), `<qty> de <prod>`.
- Separadores multi-item explícitos: `y`, `,`, `también`, `además`, `luego`, `más`.
- Cantidad hasta 20 (extender `numberMap`) y "media"=0.5 si aplica.

### Fase 5 — Aprovechar `maxAlternatives`
- Subir a 5 y, si la transcripción 0 no parsea ningún item, intentar con la 1, 2… hasta que alguna produzca match válido.

### Fase 6 — Reusar en `procesarConsulta`
- Mismo matcher para que "¿quedan vainiya?" también resuelva.

### Fase 7 — Tests
- `src/utils/matchProducto.test.js` con transcripciones reales y edge cases (vainilla, choco oreo, tres dalmata, "2 de vainiya", tie, desconocido).
- Runner según lo que use el repo (revisar `package.json` antes).

## Riesgos y convenios
- Levenshtein es O(n*m); con ~30 productos y frases cortas es despreciable. Si el catálogo creciera >500, índice invertido por token (fase opcional 8).
- Mantiene el flujo actual: voz/teclado → parsear → agregar → Grabar → modal → Dexie. No toca `procesarVenta` ni la DB.

## Orden de ejecución sugerido
1. Fases 1‑2‑3 (utilitario + scoring + ranking) → ya resuelve el 80% de los falsos positivos.
2. Fase 4 (gramática flexible).
3. Fase 7 (tests) en paralelo a cada fase.
4. Fases 5 y 6 como pulido.

## Punto de decisión
¿Avanzar con **Fase 1‑3** primero (utilitario + scoring + ranking, integrado en `Home.jsx`), o empezar por otra parte / ajustar umbral y pesos?