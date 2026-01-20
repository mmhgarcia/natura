// src/pages/DeliveryPage.jsx
import React from 'react';
import Delivery from '../components/Delivery';

const DeliveryPage = () => {
  return (
    <div style={styles.container}>
      <Delivery />
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
    minHeight: '100vh',
    backgroundColor: '#f5f7fa'
  }
};

export default DeliveryPage;