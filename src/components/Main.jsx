import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import ProductosPage from '../pages/ProductosPage';
import PedidosPage from '../pages/Pedidos';
import TasaBCV from '../pages/TasaBCV';

export default function Main() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <>
            <div style={styles.hamburgerRow}>
                <button
                    onClick={() => setIsMenuOpen(true)}
                    style={styles.hamburgerBtn}
                    aria-label="Abrir menú"
                >
                    ☰
                </button>
            </div>
            <Sidebar
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
            />
            <Routes>
                <Route path="/" element={null} />
                <Route path="/adminproductos" element={<ProductosPage />} />
                <Route path="/pedidos" element={<PedidosPage />} />
                <Route path="/tasabcv" element={<TasaBCV />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    );
}

const styles = {
    hamburgerRow: {
        padding: '0.5rem 0.75rem',
        display: 'flex',
        justifyContent: 'flex-start',
    },
    hamburgerBtn: {
        fontSize: '1.8rem',
        background: 'none',
        border: 'none',
        color: '#007bff',
        cursor: 'pointer',
        padding: 0,
    },
};
