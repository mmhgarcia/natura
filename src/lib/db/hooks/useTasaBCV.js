// src/lib/db/hooks/useTasaBCV.js
import { useState, useEffect } from 'react';
import { db } from '../database.js'; // Referencia a la instancia dbTasaBCV [2]

/**
 * Hook personalizado para gestionar la Tasa BCV en la aplicación Natura.
 * Actualizado para priorizar la obtención desde la tabla historico_tasas.
 */
export function useTasaBCV() {
    const [tasa, setTasa] = useState('');
    const [loading, setLoading] = useState(true);

    // Cargar tasa al inicio mediante el nuevo método dinámico
    useEffect(() => {
        async function loadTasa() {
            try {
                // CAMBIO FASE 2: Ya no consulta solo la tabla 'config'.
                // Llama al método que busca la tasa más reciente en el histórico [1, 3].
                const valorTasa = await db.getUltimaTasaBCV();

                if (valorTasa) {
                    // Asegurar formato de string con punto decimal para consistencia en la UI [2]
                    const valor = String(valorTasa).replace(',', '.');
                    setTasa(valor);
                } else {
                    setTasa(''); // Vacío si no existe registro en ninguna tabla [2]
                }
            } catch (error) {
                console.error('Error cargando tasa desde el historial:', error);
                setTasa('');
            } finally {
                setLoading(false);
            }
        }
        loadTasa();
    }, []);

    /**
     * Guarda la tasa. Se mantiene la escritura en la tabla 'config' como
     * mecanismo de respaldo (fallback) para compatibilidad con el sistema [3, 4].
     */
    const saveTasa = async (valor) => {
        try {
            // Normalizar: reemplazar coma por punto
            const tasaNormalizada = String(valor).replace(',', '.');
            const tasaNumero = parseFloat(tasaNormalizada);

            // Verificar que sea un número válido
            if (isNaN(tasaNumero)) {
                console.error('Valor no es un número:', valor);
                return false;
            }

            // Guardar en IndexedDB - Tabla config (mantenido para fallback de Fase 2) [5]
            await db.config.put({
                clave: 'tasa',
                valor: tasaNumero,
                updatedAt: new Date().toISOString(),
                tipo: 'decimal'
            });

            console.log('Tasa de respaldo guardada en config:', tasaNumero);
            setTasa(tasaNormalizada); // Actualiza el estado local para la UI
            return true;
        } catch (error) {
            console.error('Error guardando tasa:', error);
            return false;
        }
    };

    return { 
        tasa, 
        setTasa, 
        saveTasa, 
        loading 
    };
}