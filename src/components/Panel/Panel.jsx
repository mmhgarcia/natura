// src/components/Panel/Panel.js
import { useNavigate } from "react-router-dom";
import { useGrupos } from "./hooks/useGrupos";
import { useProductos } from "./hooks/useProductos";
import styles from "./Panel.module.css";

export default function Panel() {
  
  const navigate = useNavigate();
  
  const { importarGrupos } = useGrupos();
  const { importarProductos } = useProductos();


  // Importar Grupos y Productos
  async function ImportarDatos() {
    try {

      const resultadoGrupos = await importarGrupos();
      
      const resultadoProductos = await importarProductos();
      
      return { gruposMessage: resultadoGrupos, productosMessage: resultadoProductos };
    
    } catch (error) {
         
      return { errorMessage: error};
    
    }

  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>PANEL</h2>

      {/* Mostrar error si existe */}
      {error && (
        <div className={styles.errorAlert}>
          ❌ {error}
          <button onClick={() => {}} className={styles.closeError}>
            ×
          </button>
        </div>
      )}

      <div className={styles.buttons}>
        {/* Botones de navegación */}
        <NavButton onClick={() => navigate("/tasabcv")}>
          Tasa BCV
        </NavButton>
        
        <NavButton onClick={() => navigate("/adminproductos")}>
          Productos
        </NavButton>
        
        <NavButton onClick={() => navigate("/admingrupos")}>
          Grupos
        </NavButton>
        
        {/* Botones de acciones */}
        <ActionButton 
          onClick={ImportarDatos}          
          variant="primary"
        >
          Carga Inicial de Datos
        </ActionButton>
        
        <NavButton 
          onClick={() => navigate("/")}
          variant="back"
        >
          Regresar
        </NavButton>
      </div>
    </div>
  );
}

// Componentes auxiliares (opcionales, para mayor organización)
function NavButton({ onClick, children, variant = '' }) {
  const className = variant === 'back' 
    ? `${styles.button} ${styles.back}`
    : styles.button;
    
  return (
    <button className={className} onClick={onClick}>
      {children}
    </button>
  );
}

function ActionButton({ onClick, children, loading = false, variant = '' }) {
  let buttonClass = styles.button;
  let style = {};
  
  if (variant === 'success') {
    style.backgroundColor = '#28a745';
  } else if (variant === 'primary') {
    style.backgroundColor = loading ? '#6c757d' : '#007bff';
  }
  
  return (
    <button 
      className={buttonClass} 
      onClick={onClick}
      disabled={loading}
      style={style}
    >
      {loading ? '⏳ Procesando...' : children}
    </button>
  );
}