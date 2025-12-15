import { useState } from 'react';
import productosIniciales from "../data/data.json";

// Componente
function ListaDeProductos({ productos, seleccionarProducto }) {
  return (
    <div>
      <h3>Lista de Productos</h3>
      <ul>
        {productos.map((producto) => (
          <li key={producto.id} onClick={() => seleccionarProducto(producto)}>
            {producto.nombre} - ${producto.stock}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Componente
function ListaDeSeleccionados({ listaDeSeleccionados, eliminarProducto }) {
  
  // Totalizar Seleccionados
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
  const [productos] = useState(productosIniciales.productos);
  const [listaDeSeleccionados, setListaDeSeleccionados] = useState([]);

  // Evento 
  const seleccionarProducto = (producto) => {
    // if (!listaDeSeleccionados.some(item => item.id === producto.id)) {
      setListaDeSeleccionados([...listaDeSeleccionados, producto]);
    // }
  };

  // Evento
  const eliminarProducto = (id) => {
    setListaDeSeleccionados(listaDeSeleccionados.filter(producto => producto.id !== id));
  };

  return (

    <div>

      <h1>Selección de Productos</h1>
      
      <div>
        
        <ListaDeProductos 
          productos={productos} 
          seleccionarProducto={seleccionarProducto}
        />

        <ListaDeSeleccionados
          listaDeSeleccionados={listaDeSeleccionados}
          eliminarProducto={eliminarProducto}
        />

      </div>

    </div>

  );

}

export default Home;