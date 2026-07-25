/**
 * Script de Validación para Resumen de Inventario
 * 
 * Ejecutar en DevTools Console (F12) después de navegar a la página de Resumen de Inventario
 * 
 * Este script valida:
 * 1. Productos huérfanos (sin grupo válido)
 * 2. Grupos con margen negativo
 * 3. Tasa BCV válida (no cero)
 * 4. Productos ocultos excluidos del cálculo
 * 5. Precisión de los cálculos financieros
 */

const validarResumenInventario = async () => {
    console.clear();
    console.log('%c📊 AUDITORÍA DE RESUMEN DE INVENTARIO', 'font-size: 18px; font-weight: bold; color: #2196F3');
    console.log('='.repeat(60));

    try {
        await db.init();

        const todosProductos = await db.productos.toArray();
        const grupos = await db.grupos.toArray();
        const gruposMap = new Map(grupos.map(g => [g.nombre, g]));

        // 1. ANÁLISIS DE PRODUCTOS
        console.log('\n%c1️⃣ ANÁLISIS DE PRODUCTOS', 'font-weight: bold; color: #4CAF50');
        console.log('-'.repeat(60));

        const productosVisibles = todosProductos.filter(p => p.visible !== false);
        const productosOcultos = todosProductos.filter(p => p.visible === false);

        console.log(`Total de productos en BD: ${todosProductos.length}`);
        console.log(`✅ Productos visibles (incluidos): ${productosVisibles.length}`);
        console.log(`❌ Productos ocultos (excluidos): ${productosOcultos.length}`);

        if (productosOcultos.length > 0) {
            console.log('\n%cProductos excluidos del análisis:', 'color: #FF9800');
            productosOcultos.forEach(p => {
                console.log(`  - ${p.nombre} (Stock: ${p.stock || 0})`);
            });
        }

        // 2. PRODUCTOS HUÉRFANOS
        console.log('\n%c2️⃣ PRODUCTOS HUÉRFANOS (sin grupo válido)', 'font-weight: bold; color: #FF5722');
        console.log('-'.repeat(60));

        const huerfanos = productosVisibles.filter(p => !gruposMap.has(p.grupo) && p.stock > 0);

        if (huerfanos.length === 0) {
            console.log('✅ No hay productos huérfanos con stock');
        } else {
            console.log(`🔴 ADVERTENCIA: ${huerfanos.length} producto(s) con stock pero sin grupo válido:`);
            huerfanos.forEach(p => {
                console.log(`  - ID: ${p.id} | Nombre: ${p.nombre} | Grupo: "${p.grupo}" | Stock: ${p.stock}`);
            });
            console.log('\n⚠️ Estos productos NO se incluyen en el cálculo financiero');
        }

        // 3. GRUPOS CON MARGEN NEGATIVO
        console.log('\n%c3️⃣ VALIDACIÓN DE MÁRGENES', 'font-weight: bold; color: #9C27B0');
        console.log('-'.repeat(60));

        const margenNegativo = grupos.filter(g => g.costo_$ > g.precio);

        if (margenNegativo.length === 0) {
            console.log('✅ Todos los grupos tienen margen positivo');
        } else {
            console.log(`⚠️ ADVERTENCIA: ${margenNegativo.length} grupo(s) con margen negativo:`);
            margenNegativo.forEach(g => {
                const margen = ((g.precio - g.costo_$) / g.costo_$ * 100).toFixed(2);
                console.log(`  - ${g.nombre}: Costo $${g.costo_$} > Precio $${g.precio} (Margen: ${margen}%)`);
            });
        }

        // 4. TASA BCV
        console.log('\n%c4️⃣ TASA BCV', 'font-weight: bold; color: #00BCD4');
        console.log('-'.repeat(60));

        const tasa = await db.getUltimaTasaBCV();
        const ultimaEntrada = await db.historico_tasas.orderBy('fecha_tasa').last();

        if (tasa === 0) {
            console.log('🔴 ERROR CRÍTICO: La tasa BCV es 0');
        } else {
            console.log(`✅ Tasa BCV válida: ${tasa.toFixed(2)}`);
            if (ultimaEntrada) {
                console.log(`   Fecha: ${ultimaEntrada.fecha_tasa}`);
                console.log(`   Fuente: Histórico BCV`);
            } else {
                console.log(`   Fuente: Configuración o fallback`);
            }
        }

        // 5. CÁLCULOS FINANCIEROS
        console.log('\n%c5️⃣ CÁLCULOS FINANCIEROS', 'font-weight: bold; color: #4CAF50');
        console.log('-'.repeat(60));

        let totalCosto = 0;
        let totalVenta = 0;
        let productosContabilizados = 0;

        productosVisibles.forEach(p => {
            const grupo = gruposMap.get(p.grupo);
            if (grupo) {
                const stock = p.stock || 0;
                totalCosto += stock * (grupo.costo_$ || 0);
                totalVenta += stock * (grupo.precio || 0);
                if (stock > 0) productosContabilizados++;
            }
        });

        const gananciaUsd = totalVenta - totalCosto;
        const gananciaBs = gananciaUsd * tasa;
        const margenPromedio = totalCosto > 0 ? ((gananciaUsd / totalCosto) * 100) : 0;

        console.log(`Productos contabilizados: ${productosContabilizados}`);
        console.log(`\n💰 Inversión Total (Costo): $${totalCosto.toFixed(2)}`);
        console.log(`💵 Venta Estimada: $${totalVenta.toFixed(2)}`);
        console.log(`📈 Ganancia Potencial USD: $${gananciaUsd.toFixed(2)}`);
        console.log(`📈 Ganancia Potencial Bs: Bs. ${gananciaBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        console.log(`📊 Margen Promedio: ${margenPromedio.toFixed(2)}%`);

        // 6. RESUMEN DE VALIDACIÓN
        console.log('\n%c6️⃣ RESUMEN DE VALIDACIÓN', 'font-weight: bold; color: #E91E63');
        console.log('='.repeat(60));

        const problemas = [];

        if (huerfanos.length > 0) {
            problemas.push(`🔴 ${huerfanos.length} producto(s) huérfano(s)`);
        }
        if (margenNegativo.length > 0) {
            problemas.push(`⚠️ ${margenNegativo.length} grupo(s) con margen negativo`);
        }
        if (tasa === 0) {
            problemas.push(`🔴 Tasa BCV es 0`);
        }

        if (problemas.length === 0) {
            console.log('%c✅ VALIDACIÓN EXITOSA: No se detectaron problemas', 'color: #4CAF50; font-weight: bold');
        } else {
            console.log('%c⚠️ SE DETECTARON PROBLEMAS:', 'color: #FF5722; font-weight: bold');
            problemas.forEach(p => console.log(`   ${p}`));
        }

        console.log('\n' + '='.repeat(60));
        console.log('%c✅ Auditoría completada', 'font-size: 14px; color: #4CAF50');

        // Retornar objeto con resultados para uso programático
        return {
            totalProductos: todosProductos.length,
            productosVisibles: productosVisibles.length,
            productosOcultos: productosOcultos.length,
            productosHuerfanos: huerfanos.length,
            gruposConMargenNegativo: margenNegativo.length,
            tasaBCV: tasa,
            totales: {
                costo: totalCosto,
                venta: totalVenta,
                gananciaUsd: gananciaUsd,
                gananciaBs: gananciaBs,
                margenPromedio: margenPromedio
            },
            problemas: problemas
        };

    } catch (error) {
        console.error('❌ Error durante la auditoría:', error);
        throw error;
    }
};

// Ejecutar automáticamente
console.log('%c🚀 Ejecutando validación...', 'color: #2196F3; font-weight: bold');
validarResumenInventario().then(resultado => {
    console.log('\n%c📋 Resultado guardado en variable "resultado"', 'color: #9C27B0');
    window.resultadoAuditoria = resultado;
});
