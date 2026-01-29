import React from 'react';
import miImagen from './FreezerLayout.png'; // Ruta relativa al componente

const FreezerLayout = ({ productosSeleccionados = [] }) => {
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    paddingBottom: '20px',
  };

  const cardStyle = {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    padding: '15px',
    width: '100%',
    maxWidth: '600px',
    boxSizing: 'border-box',
    border: '1px solid #e1e4e8',
  };

  const imageContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  };

  const summaryTitleStyle = {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '15px',
    color: '#333',
    textAlign: 'center',
    borderBottom: '2px solid #00BFFF',
    paddingBottom: '8px',
  };

  const tableHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 15px',
    marginBottom: '8px',
    backgroundColor: '#e9ecef',
    borderRadius: '6px',
    fontWeight: 'bold',
    color: '#495057',
    fontSize: '14px',
  };

  const summaryListStyle = {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  };

  const summaryItemStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 15px',
    marginBottom: '8px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    border: '1px solid #dee2e6',
  };

  const itemInfoStyle = {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    flex: 1,
  };

  const idBadgeStyle = {
    backgroundColor: '#007bff',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
    minWidth: '24px',
    textAlign: 'center',
  };

  const nameStyle = {
    fontWeight: '500',
    color: '#212529',
  };

  const quantityBadgeStyle = {
    backgroundColor: '#28a745',
    color: 'white',
    padding: '4px 12px',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 'bold',
    minWidth: '30px',
    textAlign: 'center',
  };

  // Agrupar productos por ID y sumar cantidades
  const productosSumarizados = productosSeleccionados.reduce((acc, producto) => {
    const existing = acc.find(item => item.id === producto.id);
    if (existing) {
      existing.cantidad += 1;
    } else {
      acc.push({
        id: producto.id,
        nombre: producto.nombre,
        cantidad: 1,
      });
    }
    return acc;
  }, []);

  // Ordenar por ID para mejor visualización
  productosSumarizados.sort((a, b) => a.id - b.id);

  return (
    <div style={containerStyle}>
      {/* Card de la Imagen */}
      <div style={cardStyle}>
        <div style={imageContainerStyle}>
          <img src={miImagen} alt="Ubicación en Freezer" style={{ maxWidth: '100%', borderRadius: '8px' }} />
        </div>
      </div>

      {/* Card del Resumen */}
      {productosSumarizados.length > 0 && (
        <div style={cardStyle}>
          <div style={summaryTitleStyle}>
            Resumen de Productos
          </div>

          <div style={tableHeaderStyle}>
            <span style={{ width: '50px' }}>ID</span>
            <span style={{ flex: 1, textAlign: 'left', paddingLeft: '10px' }}>NOMBRE</span>
            <span style={{ minWidth: '80px', textAlign: 'right' }}>CANTIDAD</span>
          </div>

          <ul style={summaryListStyle}>
            {productosSumarizados.map((item) => (
              <li key={item.id} style={summaryItemStyle}>
                <div style={itemInfoStyle}>
                  <span style={idBadgeStyle}>{item.id}</span>
                  <span style={nameStyle}>{item.nombre}</span>
                </div>
                <span style={quantityBadgeStyle}>{item.cantidad}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FreezerLayout;