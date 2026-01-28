/**
 * Ejemplo de uso del módulo de seguridad en Natura
 * 
 * Este archivo demuestra cómo usar SecureDexie para proteger
 * datos sensibles en tu aplicación.
 */

import { SecureDexie, validatePasswordStrength, generateSecurePassword } from '../security/js/index.js';

// ============================================
// EJEMPLO 1: Crear base de datos segura
// ============================================

async function ejemplo1_CrearDBSegura() {
    console.log('📝 Ejemplo 1: Crear base de datos segura\n');

    // Generar contraseña segura
    const password = generateSecurePassword(16);
    console.log('🔑 Contraseña generada:', password);

    // Validar fortaleza
    const strength = validatePasswordStrength(password);
    console.log('💪 Fortaleza:', strength.strength);
    console.log('✅ Checks:', strength.checks);

    // Crear base de datos segura
    const secureDb = new SecureDexie(
        'natura_ejemplo',
        password,
        '¿Cuál es tu ciudad favorita?',
        'París'
    );

    // Definir esquema
    secureDb.version(1).stores({
        notas_privadas: '++id, titulo, fecha',
        configuracion: 'clave'
    });

    // Cargar módulo de seguridad
    await secureDb.loadSecurityModule();

    console.log('✅ Base de datos segura creada\n');
    return secureDb;
}

// ============================================
// EJEMPLO 2: Guardar y leer datos encriptados
// ============================================

async function ejemplo2_GuardarLeerDatos(secureDb) {
    console.log('📝 Ejemplo 2: Guardar y leer datos encriptados\n');

    // Guardar nota privada
    const id = await secureDb.secureAdd('notas_privadas', {
        titulo: 'Contraseña del WiFi',
        contenido: 'MiWiFi2024!@#',
        fecha: new Date().toISOString()
    });

    console.log('💾 Nota guardada con ID:', id);

    // Leer nota (se desencripta automáticamente)
    const nota = await secureDb.secureGet('notas_privadas', id);
    console.log('📖 Nota leída:', nota);

    // Verificar que en IndexedDB está encriptada
    const notaRaw = await secureDb.table('notas_privadas').get(id);
    console.log('🔒 Datos en IndexedDB (encriptados):', notaRaw._encrypted.substring(0, 50) + '...');

    console.log('✅ Datos guardados y leídos correctamente\n');
}

// ============================================
// EJEMPLO 3: Recuperación con pregunta de seguridad
// ============================================

async function ejemplo3_RecuperarConPregunta() {
    console.log('📝 Ejemplo 3: Recuperación con pregunta de seguridad\n');

    // Simular que el usuario olvidó su contraseña
    const secureDb = new SecureDexie('natura_ejemplo', '');

    // Obtener pregunta de seguridad
    const question = secureDb.keyManager.getSecurityQuestion();
    console.log('❓ Pregunta de seguridad:', question);

    // Intentar recuperar con respuesta correcta
    const recovered = secureDb.keyManager.recoverWithSecurityQuestion('París');

    if (recovered) {
        console.log('✅ Acceso recuperado con éxito');

        // Ahora puede acceder a los datos
        await secureDb.loadSecurityModule();
        const notas = await secureDb.secureGetAll('notas_privadas');
        console.log('📚 Notas recuperadas:', notas.length);
    } else {
        console.log('❌ Respuesta incorrecta');
    }

    console.log('');
}

// ============================================
// EJEMPLO 4: Integración con Natura DB existente
// ============================================

async function ejemplo4_IntegracionConNatura() {
    console.log('📝 Ejemplo 4: Integración con Natura DB\n');

    // Importar la DB normal de Natura
    // import { db as naturaDb } from '../lib/db/database.js';

    // Crear DB segura SEPARADA para datos sensibles
    const secureDb = new SecureDexie(
        'natura_secure',
        'contraseña_del_usuario',
        '¿Nombre de tu primera mascota?',
        'Luna'
    );

    secureDb.version(1).stores({
        backups_encriptados: '++id, fecha, tipo',
        claves_api: 'servicio'
    });

    await secureDb.loadSecurityModule();

    // Guardar backup encriptado
    await secureDb.secureAdd('backups_encriptados', {
        fecha: new Date().toISOString(),
        tipo: 'completo',
        datos: {
            // Aquí irían los datos exportados de naturaDb
            productos: [],
            ventas: [],
            pedidos: []
        }
    });

    console.log('✅ Backup encriptado guardado');

    // Guardar clave API encriptada
    await secureDb.secureAdd('claves_api', {
        servicio: 'bcv',
        api_key: 'sk_live_123456789',
        fecha_creacion: new Date().toISOString()
    });

    console.log('✅ Clave API encriptada guardada');
    console.log('');
}

// ============================================
// EJEMPLO 5: Cambiar contraseña
// ============================================

async function ejemplo5_CambiarContraseña(secureDb) {
    console.log('📝 Ejemplo 5: Cambiar contraseña\n');

    const oldPassword = secureDb.keyManager.getPassword();
    const newPassword = generateSecurePassword(16);

    console.log('🔑 Nueva contraseña:', newPassword);

    // Cambiar contraseña y re-encriptar datos
    await secureDb.changePassword(oldPassword, newPassword, 'notas_privadas');

    console.log('✅ Contraseña cambiada y datos re-encriptados');
    console.log('');
}

// ============================================
// EJEMPLO 6: Bloquear y desbloquear
// ============================================

async function ejemplo6_BloquearDesbloquear(secureDb) {
    console.log('📝 Ejemplo 6: Bloquear y desbloquear\n');

    const password = secureDb.keyManager.getPassword();

    // Bloquear (limpia la contraseña de memoria)
    secureDb.lock();
    console.log('🔒 Base de datos bloqueada');

    try {
        // Intentar acceder a datos bloqueados
        await secureDb.secureGetAll('notas_privadas');
    } catch (error) {
        console.log('❌ Error esperado:', error.message);
    }

    // Desbloquear
    secureDb.unlock(password);
    console.log('🔓 Base de datos desbloqueada');

    // Ahora sí funciona
    const notas = await secureDb.secureGetAll('notas_privadas');
    console.log('✅ Acceso restaurado, notas:', notas.length);
    console.log('');
}

// ============================================
// EJECUTAR TODOS LOS EJEMPLOS
// ============================================

async function ejecutarEjemplos() {
    console.log('🚀 Iniciando ejemplos del módulo de seguridad\n');
    console.log('='.repeat(50) + '\n');

    try {
        const secureDb = await ejemplo1_CrearDBSegura();
        await ejemplo2_GuardarLeerDatos(secureDb);
        await ejemplo3_RecuperarConPregunta();
        await ejemplo4_IntegracionConNatura();
        await ejemplo5_CambiarContraseña(secureDb);
        await ejemplo6_BloquearDesbloquear(secureDb);

        console.log('='.repeat(50));
        console.log('✅ Todos los ejemplos completados con éxito');
    } catch (error) {
        console.error('❌ Error en ejemplos:', error);
    }
}

// Descomentar para ejecutar en consola del navegador
// ejecutarEjemplos();

export {
    ejemplo1_CrearDBSegura,
    ejemplo2_GuardarLeerDatos,
    ejemplo3_RecuperarConPregunta,
    ejemplo4_IntegracionConNatura,
    ejemplo5_CambiarContraseña,
    ejemplo6_BloquearDesbloquear,
    ejecutarEjemplos
};
