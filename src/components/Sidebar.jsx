import React from 'react';
import { Link, useNavigate } from "react-router-dom";

export default function Sidebar({ isOpen, onClose }) {
    const navigate = useNavigate();

    const handleAdminAccess = (e) => {
        e.preventDefault();
        const pin = window.prompt("Ingrese el PIN de acceso:");
        if (pin === "aaaaa") { 
            navigate("/Panel");
            onClose();
        } else {
            alert("Acceso denegado: PIN incorrecto.");
        }
    };

    // Función para manejar hover
    const handleMouseEnter = (e) => {
        e.target.style.backgroundColor = '#f0f8ff';
    };

    const handleMouseLeave = (e) => {
        e.target.style.backgroundColor = 'transparent';
    };

    // Estilos definidos como objeto
    const styles = {
        sidebar: {
            position: 'fixed',
            top: 0,
            left: 0,
            height: '100vh',
            width: '250px',
            backgroundColor: '#ffffff',
            boxShadow: '2px 0 10px rgba(0,0,0,0.2)',
            zIndex: 1001,
            transition: 'transform 0.3s ease-in-out',
            display: 'flex',
            flexDirection: 'column',
        },
        overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
        },
        header: {
            padding: '20px',
            borderBottom: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#00BFFF',
        },
        title: { 
            color: 'white', 
            margin: 0, 
            fontSize: '1.2rem' 
        },
        closeBtn: { 
            background: 'none', 
            border: 'none', 
            color: 'white', 
            fontSize: '2rem', 
            cursor: 'pointer' 
        },
        nav: { 
            display: 'flex', 
            flexDirection: 'column', 
            padding: '10px' 
        },
        link: {
            padding: '15px',
            textDecoration: 'none',
            color: '#333',
            fontSize: '1.1rem',
            borderBottom: '1px solid #f5f5f5',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'background-color 0.2s'
        },
        icon: {
            fontSize: '1.2rem',
            width: '24px',
            textAlign: 'center'
        }
    };

    return (
        <>
            {/* Overlay para cerrar al tocar fuera */}
            {isOpen && (
                <div onClick={onClose} style={styles.overlay} />
            )}

            {/* Contenedor del Menú Lateral */}
            <div style={{
                ...styles.sidebar,
                transform: isOpen ? 'translateX(0)' : 'translateX(-100%)'
            }}>
                <div style={styles.header}>
                    <h3 style={styles.title}>Natura Menu</h3>
                    <button onClick={onClose} style={styles.closeBtn}>×</button>
                </div>

                <nav style={styles.nav}>
                    {/* Opción Inicio */}
                    <Link 
                        to="/" 
                        onClick={onClose} 
                        style={styles.link}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        <span style={styles.icon}>🏠</span>
                        <span>Inicio</span>
                    </Link>
                    
                    {/* Opción Pedidos */}
                    <Link 
                        to="/pedidos" 
                        onClick={onClose} 
                        style={styles.link}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        <span style={styles.icon}>📋</span>
                        <span>Pedidos</span>
                    </Link>
                    
                    {/* Opción Tasa Delivery */}
                    <Link 
                        to="/delivery" 
                        onClick={onClose} 
                        style={styles.link}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        <span style={styles.icon}>🚚</span>
                        <span>Tasa Delivery</span>
                    </Link>
                    
                    {/* Opción Tasa BCV */}
                    <Link 
                        to="/tasabcv" 
                        onClick={onClose} 
                        style={styles.link}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        <span style={styles.icon}>💰</span>
                        <span>Tasa BCV</span>
                    </Link>
                    
                    {/* Opción Acerca de */}
                    <Link 
                        to="/about" 
                        onClick={onClose} 
                        style={styles.link}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        <span style={styles.icon}>ℹ️</span>
                        <span>Acerca de</span>
                    </Link>
                    
                    {/* Acceso Administrativo */}
                    <a 
                        onClick={handleAdminAccess} 
                        style={styles.link}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        <span style={styles.icon}>⚙️</span>
                        <span>Panel de Control</span>
                    </a>
                </nav>
            </div>
        </>
    );
}