import os
import re
from pathlib import Path

def completar_fases_finales():
    base_path = Path(".")
    app_jsx = base_path / "src" / "App.jsx"
    home_jsx = base_path / "src" / "pages" / "Home.jsx"
    
    # Archivos obsoletos a eliminar
    archivos_obsoletos = [
        base_path / "src" / "pages" / "AdminGrupos.jsx",
        base_path / "src" / "pages" / "AdminProductos.jsx",
        base_path / "src" / "pages" / "Home copy.jsx",
        base_path / "src" / "hooks" / "useLocalStorage.js"
    ]

    print("--- Iniciando Fase Final de Refactorización ---")

    # 1. ELIMINAR ARCHIVOS OBSOLETOS
    for archivo in archivos_obsoletos:
        if archivo.exists():
            os.remove(archivo)
            print(f"✓ Eliminado archivo obsoleto: {archivo.name}")

    # 2. RE-CONECTAR RUTAS EN App.jsx
    # Redirigimos /admingrupos y /adminproductos a las versiones que usan IndexedDB
    if app_jsx.exists():
        content = app_jsx.read_text(encoding='utf-8')
        # Cambiamos las importaciones para usar las "Pages" que cargan los CRUDs de IndexedDB
        content = content.replace('import AdminProductos from "./pages/AdminProductos";', '')
        content = content.replace('import AdminGrupos from "./pages/AdminGrupos";', '')
        
        # Aseguramos que las rutas usen los componentes correctos
        content = re.sub(r'<Route path="/adminproductos" element={<AdminProductos />} />', 
                         '<Route path="/adminproductos" element={<ProductosPage />} />', content)
        content = re.sub(r'<Route path="/admingrupos" element={<AdminGrupos />} />', 
                         '<Route path="/admingrupos" element={<GruposPage />} />', content)
        
        app_jsx.write_text(content, encoding='utf-8')
        print(f"✓ App.jsx: Rutas administrativas vinculadas a IndexedDB.")

    # 3. IMPLEMENTAR LÓGICA DE PRECIOS REALES EN Home.jsx
    if home_jsx.exists():
        new_home_logic = """import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { db } from '../lib/db/database.js';
import { getTasaBCV } from '../lib/db/utils/tasaUtil.js';

function Home() {
    const [productos, setProductos] = useState([]);
    const [grupos, setGrupos] = useState([]);
    const [listaDeSeleccionados, setListaDeSeleccionados] = useState([]);
    const [tasa, setTasa] = useState(0);
    const [cargando, setCargando] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const cargarTodo = async () => {
            try {
                await db.init();
                const [p, g, t] = await Promise.all([
                    db.getAll('productos'),
                    db.getAll('grupos'),
                    getTasaBCV()
                ]);
                setProductos(p);
                setGrupos(g);
                setTasa(t || 0);
            } catch (err) {
                console.error("Error inicializando Home:", err);
            } finally {
                setCargando(false);
            }
        };
        cargarTodo();
    }, []);

    const seleccionarProducto = (producto) => {
        setListaDeSeleccionados(prev => [...prev, producto]);
    };

    const calcularTotales = () => {
        let usd = 0;
        listaDeSeleccionados.forEach(item => {
            // Buscamos el precio del grupo al que pertenece el producto
            const grupoInfo = grupos.find(g => g.nombre === item.grupo);
            usd += grupoInfo ? grupoInfo.precio : 0;
        });
        return { usd, bs: usd * tasa };
    };

    const { usd, bs } = calcularTotales();

    if (cargando) return <div>Cargando tienda...</div>;

    return (
        <div style={{ padding: '20px', paddingBottom: '150px' }}>
            <h1>Natura Ice</h1>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                {productos.filter(p => p.stock > 0).map(p => (
                    <div key={p.id} onClick={() => seleccionarProducto(p)} style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '8px' }}>
                        <img src={p.imagen} style={{ width: '100%', height: '100px', objectFit: 'cover' }} />
                        <p>{p.nombre}</p>
                        <small>Stock: {p.stock}</small>
                    </div>
                ))}
            </div>

            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', padding: '20px', borderTop: '2px solid #007bff' }}>
                <h3>Total: ${usd.toFixed(2)} | Bs. {bs.toFixed(2)}</h3>
                <button onClick={() => setListaDeSeleccionados([])}>Vaciar</button>
                <button onClick={() => navigate("/Panel")} style={{ marginLeft: '10px' }}>Panel Admin</button>
            </div>
        </div>
    );
}

export default Home;
"""
        home_jsx.write_text(new_home_logic, encoding='utf-8')
        print(f"✓ Home.jsx: Cálculo de precios por grupo implementado.")

    print("--- Refactorización finalizada ---")

if __name__ == "__main__":
    completar_fases_finales()