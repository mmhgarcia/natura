import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
// import productosIniciales from "../data/data.json"; // Ya no se usa directamente
import { db } from '../lib/db/database.js';

// Componente ListaDeProductos - MODIFICADO (sin nombre y sin símbolo $)
function ListaDeProductos({ productos, seleccionarProducto }) {
  return (
    <div style={styles.listaContainer}>
      <h3>Lista de Productos</h3>
      <div style={styles.gridContainer}>
        {productos.map((producto) => (
          <div 
            key={producto.id} 
            style={styles.card}
            onClick={() => seleccionarProducto(producto)}
          >
            {/* Imagen del producto */}
            {producto.imagen ? (
              <img 
                src={producto.imagen} 
                alt={producto.nombre}
                style={styles.imagen}
              />
            ) : (
              <div style={styles.placeholderImagen}>
                Sin imagen
              </div>
            )}
            
            {/* Información del producto - SOLO ID y STOCK */}
            <div style={styles.infoContainer}>
              <p style={styles.detalle}>
                #{producto.id} - Stock: {producto.stock}
              </p>
              <p style={styles.precio}>{producto.precio}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Componente ListaDeSeleccionados (sin cambios)
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

// Estilos para el componente ListaDeProductos - ALTURA DE IMÁGENES AUMENTADA
const styles = {
  listaContainer: {
    flex: 1,
  },
  gridContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '40px', // Separación vertical de 40px entre cards
    maxWidth: '600px',
  },
  card: {
    backgroundColor: '#ffffff', // Fondo blanco
    borderRadius: '12px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    width: '100%',
    // Padding: top, left, right a 0
    paddingTop: '0',
    paddingLeft: '0',
    paddingRight: '0',
    ':hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
    },
  },
  imagen: {
    width: '90%',
    maxWidth: '90%',
    height: '340px', // Aumentado de 280px a 340px (+60px)
    objectFit: 'cover',
    display: 'block',
    margin: '0 auto',
    paddingTop: '15px', // Mantenemos solo el padding top en la imagen
  },
  placeholderImagen: {
    width: '90%',
    height: '340px', // Aumentado de 280px a 340px (+60px)
    backgroundColor: '#f5f5f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#888',
    fontSize: '14px',
    margin: '0 auto',
    paddingTop: '15px', // Mantenemos solo el padding top en el placeholder
  },
  infoContainer: {
    // Aquí mantenemos padding en todos los lados para el contenido
    padding: '15px',
    textAlign: 'center',
  },
  detalle: {
    margin: '0 0 8px 0',
    color: '#666',
    fontSize: '14px',
  },
  precio: {
    margin: '0',
    color: '#2c3e50',
    fontSize: '20px',
    fontWeight: 'bold',
  },
};

// Componente Home (sin cambios)
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