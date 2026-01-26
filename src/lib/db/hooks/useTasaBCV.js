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

    return { 
        tasa, 
        setTasa, 
        loading 
    };
}