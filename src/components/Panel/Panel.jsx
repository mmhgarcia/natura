// src/components/Panel/Panel.js
import { useNavigate } from "react-router-dom";
import { useGrupos } from "./hooks/useGrupos";
import { useProductos } from "./hooks/useProductos";
import styles from "./Panel.module.css";

export default function Panel() {
  
  const navigate = useNavigate();
  
  const { 
    importarGrupos, 
    verificarGrupos, 
    loading, 
    error 
  } = useGrupos();

  // Importacion de Grupos y Productos
  const handleImportar = async () => {
    
    const resultado = await importarGrupos();
    
    if (resultado.cancelled) return;
    
    if (resultado.success) {
      alert(`✅ ${resultado.message}`);
    } else {
      alert(`❌ Error: ${resultado.error}`);
    }
  };

  const handleVerificar = async () => {
    const resultado = await verificarGrupos();
    
    if (resultado.success) {
      console.log('📊 Grupos en BD:', resultado.data);
      console.table(resultado.data);
      
      const lista = resultado.data
        .map(g => `${g.nombre}: ${g.precio}`)
        .join('\n');
      
      alert(`✅ ${resultado.message}:\n\n${lista}`);
    } else {
      alert(`❌ Error: ${resultado.error}`);
    }
  };

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
          onClick={handleImportar} 
          loading={loading}
          variant="primary"
        >
          Carga Inicial de Datos
        </ActionButton>
        
        <ActionButton 
          onClick={handleVerificar}
          variant="success"
        >
          Verificar Importación
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