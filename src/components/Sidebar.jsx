import { Link } from "react-router-dom";

export default function Sidebar({ isOpen, onClose }) {
    const styles = {
        sidebar: {
            position: 'fixed',
            top: 0,
            left: 0,
            height: '100vh',
            width: '250px',
            backgroundColor: '#ffffff',
            boxShadow: '2px 0 10px rgba(0,0,0,0.2)',
            zIndex: 10002,
            transition: 'transform 0.3s ease-in-out',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        },
        overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 10001,
            backdropFilter: 'blur(2px)',
        },
        header: {
            padding: '20px',
            borderBottom: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#00BFFF',
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
            overflowY: 'auto',
            flexGrow: 1,
            minHeight: 0,
            WebkitOverflowScrolling: 'touch',
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
            whiteSpace: 'nowrap',
        },
        icon: {
            fontSize: '1.2rem'
        },
    };

    return (
        <>
            {isOpen && (
                <div onClick={onClose} style={styles.overlay} />
            )}

            <div style={{
                ...styles.sidebar,
                transform: isOpen ? 'translateX(0)' : 'translateX(-100%)'
            }}>
                <div style={styles.header}>
                    <h3 style={styles.title}>Natura Menu</h3>
                    <button onClick={onClose} style={styles.closeBtn}>×</button>
                </div>

                <nav style={styles.nav}>
                    <div style={{ padding: '5px 15px', fontSize: '0.8rem', color: '#888', fontWeight: 'bold' }}>CATÁLOGO</div>
                    <Link
                        to="/adminproductos"
                        onClick={onClose}
                        style={styles.link}
                    >
                        <span style={styles.icon}>🍦</span>
                        <span>Productos (Catálogo)</span>
                    </Link>
                    <Link
                        to="/admingrupos"
                        onClick={onClose}
                        style={styles.link}
                    >
                        <span style={styles.icon}>🗂️</span>
                        <span>Categorías de Producto</span>
                    </Link>
                    <Link
                        to="/controlstock"
                        onClick={onClose}
                        style={styles.link}
                    >
                        <span style={styles.icon}>📦</span>
                        <span>Control de Stock</span>
                    </Link>

                    <div style={{ padding: '5px 15px', fontSize: '0.8rem', color: '#888', fontWeight: 'bold' }}>VENTAS</div>
                    <Link
                        to="/"
                        onClick={onClose}
                        style={styles.link}
                    >
                        <span style={styles.icon}>🧾</span>
                        <span>Facturación (POS)</span>
                    </Link>
                    <Link
                        to="/pedidos"
                        onClick={onClose}
                        style={styles.link}
                    >
                        <span style={styles.icon}>📋</span>
                        <span>Gestión de Pedidos</span>
                    </Link>

                    <div style={{ padding: '5px 15px', fontSize: '0.8rem', color: '#888', fontWeight: 'bold' }}>FINANZAS</div>
                    <Link
                        to="/tasabcv"
                        onClick={onClose}
                        style={styles.link}
                    >
                        <span style={styles.icon}>📈</span>
                        <span>Tasa BCV</span>
                    </Link>
                </nav>
            </div>
        </>
    );
}
