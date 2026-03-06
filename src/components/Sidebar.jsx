import React, { useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import ConsultaStockModal from './ConsultaStockModal';

export default function Sidebar({ isOpen, onClose }) {
    const navigate = useNavigate();
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);

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

    const handleOpenStockModal = (e) => {
        e.preventDefault();
        setIsStockModalOpen(true);
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
            zIndex: 9999,
            transition: 'transform 0.3s ease-in-out',
            display: 'flex',
            flexDirection: 'column',
            // Asegura que el sidebar no se mueva si el contenido es largo
            overflow: 'hidden'
        },
        overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.5)',
            // Subimos el zIndex para que bloquee botones o modales de la UI principal
            zIndex: 9998,
            backdropFilter: 'blur(2px)', // Toque estético moderno
        },
        header: {
            padding: '20px',
            borderBottom: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#00BFFF',
            // El header se queda fijo arriba
            flexShrink: 0,
        },
        title: {
            margin: 0,
            fontSize: '1.2rem',
            color: 'white',
            fontWeight: 'bold'
        },
        closeBtn: {
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '1.8rem',
            cursor: 'pointer',
            lineHeight: 1
        },
        nav: {
            display: 'flex',
            flexDirection: 'column',
            padding: '10px',
            // ESTO HACE QUE LA LISTA SEA DESPLAZABLE
            overflowY: 'auto',
            flexGrow: 1,
            minHeight: 0, // Importante para que flex-grow funcione con overflow
            WebkitOverflowScrolling: 'touch', // Scroll suave en móviles
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
            transition: 'background-color 0.2s',
            // Evita que el texto se rompa en varias líneas si es largo
            whiteSpace: 'nowrap',
        },
        icon: {
            fontSize: '1.2rem'
        },
        separator: {
            border: 'none',
            borderTop: '1px solid lightgray',
            margin: '0px 10px',
            flexShrink: 0,
            opacity: 1,
            display: 'block',
        },
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
                    <div style={{ padding: '5px 15px', fontSize: '0.8rem', color: '#888', fontWeight: 'bold' }}>VENTAS</div>
                    {/* Opción Inicio */}
                    <Link
                        to="/"
                        onClick={onClose}
                        style={styles.link}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        <span style={styles.icon}>🏠</span>
                        <span>Inicio (Tienda)</span>
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
                        <span>Gestión de Pedidos</span>
                    </Link>

                    <Link
                        to="/registrogasto"
                        onClick={onClose}
                        style={styles.link}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        <span style={styles.icon}>💸</span>
                        <span>Registrar Gastos</span>
                    </Link>

                    <hr style={styles.separator} />
                    <div style={{ padding: '5px 15px', fontSize: '0.8rem', color: '#888', fontWeight: 'bold' }}>INVENTARIO</div>

                    <Link
                        to="#"
                        onClick={handleOpenStockModal}
                        style={styles.link}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        <span style={styles.icon}>📦</span>
                        <span>Consulta de Stock</span>
                    </Link>

                    <Link to="/resumeninventario" onClick={onClose} style={styles.link}>
                        <span style={styles.icon}>📉</span> Resumen de Inventario
                    </Link>

                    <Link to="/freezergrid" onClick={onClose} style={styles.link}>
                        <span style={styles.icon}>🧊</span> Ubicación Freezer
                    </Link>

                    <hr style={styles.separator} />
                    <div style={{ padding: '5px 15px', fontSize: '0.8rem', color: '#888', fontWeight: 'bold' }}>ANALÍTICA Y BI</div>

                    <Link to="/estadisticas" onClick={onClose} style={styles.link}>
                        <span style={styles.icon}>📊</span> Estadísticas (BI)
                    </Link>

                    <hr style={styles.separator} />
                    <div style={{ padding: '5px 15px', fontSize: '0.8rem', color: '#888', fontWeight: 'bold' }}>CONFIGURACIÓN</div>

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

                    <Link to="/admingrupos" onClick={onClose} style={styles.link}>
                        <span style={styles.icon}>📁</span> Grupos de Producto
                    </Link>

                    <Link to="/adminproductos" onClick={onClose} style={styles.link}>
                        <span style={styles.icon}>🍦</span> Productos
                    </Link>

                    <hr style={styles.separator} />
                    <div style={{ padding: '5px 15px', fontSize: '0.8rem', color: '#888', fontWeight: 'bold' }}>SISTEMA</div>

                    {/* Acceso Administrativo */}
                    <a
                        onClick={handleAdminAccess}
                        style={styles.link}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        <span style={styles.icon}>🛡️</span>
                        <span>Panel de Control</span>
                    </a>

                    <Link to="/testfinanzas" onClick={onClose} style={styles.link}>
                        <span style={styles.icon}>🧪</span> Test Finanzas
                    </Link>

                </nav>

            </div>

            <ConsultaStockModal
                isOpen={isStockModalOpen}
                onClose={() => setIsStockModalOpen(false)}
            />
        </>
    );
}