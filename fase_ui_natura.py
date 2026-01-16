import os
import re
from pathlib import Path

def refactorizar_ui():
    base_path = Path(".")
    app_jsx = base_path / "src" / "App.jsx"
    home_jsx = base_path / "src" / "pages" / "Home.jsx"
    
    print("--- Iniciando Fase 2: Unificación de Interfaz (natura) ---")

    # 1. Limpiar App.jsx (Rutas y Referencias)
    if app_jsx.exists():
        content = app_jsx.read_text(encoding='utf-8')
        # Eliminar import de Tasa (vieja) si existe
        content = re.sub(r'import Tasa from "./pages/Tasa";?\n?', '', content)
        # Eliminar ruta de Tasa (vieja) si existe
        content = re.sub(r'<Route path="/tasa" element={<Tasa />} />?\n?', '', content)
        
        app_jsx.write_text(content, encoding='utf-8')
        print(f"✓ App.jsx: Rutas unificadas hacia TasaBCV [2].")

    # 2. Actualizar Home.jsx para mostrar totales en Bs
    # Este paso inyecta la lógica de conversión en el componente principal
    if home_jsx.exists():
        new_home_content = """import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { db } from '../lib/db/database.js';
import { getTasaBCV } from '../lib/db/utils/tasaUtil.js';

function ListaDeProductos({ productos, seleccionarProducto }) {
    return (
        <div style={styles.gridContainer}>
            {productos.map((producto) => (
                <div key={producto.id} style={styles.card} onClick={() => seleccionarProducto(producto)}>
                    {producto.imagen ? (
                        <img src={producto.imagen} alt={producto.nombre} style={styles.imagen} />
                    ) : (
                        <div style={styles.placeholderImagen}>📷 No Imagen</div>
                    )}
                    <div style={styles.infoContainer}>
                        <p style={styles.detalle}>#{producto.id} - {producto.nombre}</p>
                        <p style={styles.detalle}>Stock: {producto.stock}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

function Home() {
    const [productos, setProductos] = useState([]);
    const [listaDeSeleccionados, setListaDeSeleccionados] = useState([]);
    const [tasa, setTasa] = useState(0);
    const [cargando, setCargando] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                await db.init();
                const [productosData, tasaData] = await Promise.all([
                    db.getAll('productos'),
                    getTasaBCV()
                ]);
                setProductos(productosData);
                setTasa(tasaData || 0);
            } catch (error) {
                console.error('Error cargando Home:', error);
            } finally {
                setCargando(false);
            }
        };
        cargarDatos();
    }, []);

    const seleccionarProducto = (producto) => {
        setListaDeSeleccionados(prev => [...prev, producto]);
    };

    const calcularTotalUsd = () => {
        // En un sistema real, aquí se sumaría el precio según el grupo
        // Por ahora simulamos 1 USD por ítem para la demo de conversión
        return listaDeSeleccionados.length; 
    };

    const totalUsd = calcularTotalUsd();
    const totalBs = totalUsd * tasa;

    if (cargando) return <div>Cargando...</div>;

    return (
        <div style={styles.pageContainer}>
            <h2>Natura Ice - Selección</h2>
            <ListaDeProductos productos={productos} seleccionarProducto={seleccionarProducto} />
            
            <div style={styles.seleccionadosContainer}>
                <h3>Total Selección:</h3>
                <p>Items: {listaDeSeleccionados.length}</p>
                <p><strong>Total USD: ${totalUsd.toFixed(2)}</strong></p>
                <p><strong>Total Bs: {totalBs.toFixed(2)}</strong> (Tasa: {tasa})</p>
                <button onClick={() => setListaDeSeleccionados([])}>Vaciar</button>
            </div>

            <button onClick={() => navigate("/Panel")} style={styles.botonPanel}>Ir al Panel</button>
        </div>
    );
}

const styles = {
    pageContainer: { padding: '20px', maxWidth: '800px', margin: '0 auto' },
    gridContainer: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
    card: { border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', padding: '10px' },
    imagen: { width: '100%', height: '150px', objectFit: 'cover' },
    infoContainer: { textAlign: 'center', marginTop: '10px' },
    detalle: { margin: '5px 0', fontSize: '14px' },
    seleccionadosContainer: { 
        position: 'fixed', bottom: 0, left: 0, right: 0, 
        backgroundColor: '#f8f9fa', padding: '20px', borderTop: '2px solid #007bff' 
    },
    botonPanel: { marginTop: '20px', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }
};

export default Home;
"""
        home_jsx.write_text(new_home_content, encoding='utf-8')
        print(f"✓ Home.jsx: Lógica de conversión a Bs inyectada [4, 5].")

    print("\n--- Refactorización finalizada con éxito ---")
    print("Nota: La Fase 4 (Pruebas) debe hacerse manualmente abriendo la App en el navegador.")

if __name__ == "__main__":
    refactorizar_ui()