import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
// import productosIniciales from "../data/data.json"; // Ya no se usa directamente
import { db } from '../lib/db/database.js';

// Componente ListaDeProductos
function ListaDeProductos({ productos, seleccionarProducto }) {
  return (
    <div>
      <h3>Lista de Productos</h3>
      <ul>
        {productos.map((producto) => (
          <li key={producto.id} onClick={() => seleccionarProducto(producto)}>
            {producto.nombre} - ${producto.precio} {/* Cambié stock por precio */}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Componente ListaDeSeleccionados
function ListaDeSeleccionados({ listaDeSeleccionados, eliminarProducto }) {
  
  const calcularTotal = () => {
    return listaDeSeleccionados.reduce((total, producto) => total + producto.precio, 0);
  };

  return (
    <div>
      <h3>Productos Seleccionados</h3>
      
      {listaDeSeleccionados.length === 0 ? (
        <p>No hay productos seleccionados</p>
      ) : (
        <>
          <ul>
            {listaDeSeleccionados.map((producto) => (
              <li key={`selected-${producto.id}`}>
                {producto.nombre} - ${producto.precio}
                <button onClick={() => eliminarProducto(producto.id)}>
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
          
          <div>
            <div>
              <strong>Total de productos:</strong>
              <span>{listaDeSeleccionados.length}</span>
            </div>
            <div>
              <strong>Total a pagar:</strong>
              <span>${calcularTotal()}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Home() {
  // Estados
  const [productos, setProductos] = useState([]);
  const [listaDeSeleccionados, setListaDeSeleccionados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const inicializarYcargarDatos = async () => {
      try {
        setCargando(true);
        
        // Primero inicializamos la base de datos
        await db.init();
        
        // Luego cargamos los productos
        const data = await db.getAll('productos');

        if (isMounted) {
          setProductos(data);
          setError(null);
        }

      } catch (error) {
        console.error('Error:', error);
        if (isMounted) {
          setError('Error al cargar los productos');
          // Opcional: cargar datos iniciales del JSON si la base de datos falla
          // setProductos(productosIniciales.productos);
        }
      } finally {
        if (isMounted) {
          setCargando(false);
        }
      }
    };
    
    inicializarYcargarDatos();
    
    // Función de limpieza
    return () => {
      isMounted = false;
    };
  }, []);

  // Evento - con prevención de duplicados
  const seleccionarProducto = (producto) => {
    if (!listaDeSeleccionados.some(item => item.id === producto.id)) {
      setListaDeSeleccionados(prev => [...prev, producto]);
    }
  };

  // Evento
  const eliminarProducto = (id) => {
    setListaDeSeleccionados(prev => prev.filter(producto => producto.id !== id));
  };

  // Estados de carga y error
  if (cargando) {
    return (
      <div>
        <h1>Selección de Productos</h1>
        <p>Cargando productos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1>Selección de Productos</h1>
        <p style={{ color: 'red' }}>{error}</p>
        <button onClick={() => window.location.reload()}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1>Selección de Productos</h1>
      
      <div style={{ display: 'flex', gap: '2rem' }}>
        <ListaDeProductos 
          productos={productos} 
          seleccionarProducto={seleccionarProducto}
        />

        <ListaDeSeleccionados
          listaDeSeleccionados={listaDeSeleccionados}
          eliminarProducto={eliminarProducto}
        />
      </div>

      <button 
        onClick={() => navigate("/Panel")}
        style={{ marginTop: '2rem' }}
      >
        Panel
      </button>
    </div>
  );
}

export default Home;