import React from 'react';
import miImagen from './FreezerLayout.png'; // Ruta relativa al componente

const FreezerLayout = () => {
  const containerStyle = {
    display: 'flex',
    justifyContent: 'center', // Centrado horizontal
    alignItems: 'center',     // Centrado vertical
    height: 'auto',          // Opcional: para que ocupe toda la pantalla
    border: '1px solid #ccc',
    marginTop: '25px',
    
  };

  return (
    <div style={containerStyle}>
      <img src={miImagen} alt="Descripción de la imagen" style={{ maxWidth: '100%' }} />
    </div>
  );
};

export default FreezerLayout;