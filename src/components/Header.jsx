import React, { useState } from 'react';
import Sidebar from './Sidebar';

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header style={styles.header}>
            <div style={styles.nav}>
                {/* Botón Tipo Side Menu (Hamburguesa) */}
                <button
                    onClick={() => setIsMenuOpen(true)}
                    style={styles.menuBtn}
                >
                    ☰
                </button>

                <h1 style={styles.brand}>
                    Natura App 
                </h1>
                <div style={{ width: '40px' }} /> {/* Espaciador para centrar título */}
            </div>

            <Sidebar
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
            />
        </header>
    );
}

const styles = {
    header: {
        padding: '0.5rem 1rem',
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #dee2e6',
        position: 'sticky',
        top: 0,
        zIndex: 10000
    },
    nav: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    menuBtn: {
        fontSize: '1.8rem',
        background: 'none',
        border: 'none',
        color: '#007bff',
        cursor: 'pointer',
        marginLeft: '0px'
    },
    brand: {
        fontSize: '1.8rem',
        margin: 0,
        color: '#333',
        fontWeight: 'bold'
    }
};