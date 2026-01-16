import { Link, useNavigate } from "react-router-dom";

export default function Header() {
    const navigate = useNavigate();

    const handleAdminAccess = (e) => {
        // Evitamos que el enlace actúe como una navegación normal inmediatamente
        e.preventDefault();

        // Solicitamos el PIN de acceso
        const pin = window.prompt("Ingrese el PIN de acceso:");

        // Verificamos el PIN solicitado (aaaaa)
        if (pin === "aaaaa") {
            navigate("/Panel");
        } else {
            alert("Acceso denegado: PIN incorrecto.");
        }
    };

    return (
        <header style={styles.header}>
            <nav style={styles.nav}>
                <Link to="/" style={styles.link}>Inicio</Link>
                <Link to="/about" style={styles.link}>Acerca de</Link>
                
                {/* Nueva opción de Panel con validación */}
                <span 
                    onClick={handleAdminAccess} 
                    style={{ ...styles.link, cursor: 'pointer' }}
                >
                    Panel
                </span>
            </nav>
        </header>
    );
}

const styles = {
    header: {
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #dee2e6',
        marginBottom: '20px'
    },
    nav: {
        display: 'flex',
        justifyContent: 'center',
        gap: '20px'
    },
    link: {
        textDecoration: 'none',
        color: '#007bff',
        fontWeight: 'bold'
    }
};