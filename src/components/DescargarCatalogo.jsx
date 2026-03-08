import { db } from '../lib/db/database';

export const handleDescargarCatalogo = async () => {
    try {
        // Obtener datos de la base de datos
        const grupos = await db.getAll('grupos');
        const productos = await db.getAll('productos');

        // Fecha actual en formato DD/MM/YYYY
        const today = new Date();
        const formattedDate = today.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        let content = 'CATALOGO DE SABORES\n';
        content += `${formattedDate}\n`;
        content += '--------------------------------------------------------------------------\n';

        // Agrupar productos por grupo
        for (const grupo of grupos) {
            const productosDelGrupo = productos.filter(p => p.grupo === grupo.nombre);

            // Si no hay productos en el grupo, saltar
            if (productosDelGrupo.length === 0) continue;

            content += `${grupo.nombre.toUpperCase()}  -  precio $: ${grupo.precio || 0}\n`;
            content += `${'ID'.padEnd(10)} ${'NOMBRE'.padEnd(40)} ${'STOCK'.padEnd(10)}\n`;
            content += '--------------------------------------------------------------------------\n';

            productosDelGrupo.forEach(p => {
                // p.id es el ID del producto, p.nombre el sabor, p.stock la cantidad
                const idStr = String(p.id || '').padEnd(10);
                const nombreStr = String(p.nombre || '').padEnd(40);
                const stockStr = String(p.stock || 0).padEnd(10);

                content += `${idStr} ${nombreStr} ${stockStr}\n`;
            });

            content += '--------------------------------------------------------------------------\n\n';
        }

        // Crear el blob y descargar
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Catalogo_Sabores_${formattedDate.replace(/\//g, '-')}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

    } catch (error) {
        console.error("Error al generar el catálogo:", error);
        alert("Hubo un error al generar el archivo.");
    }
};
