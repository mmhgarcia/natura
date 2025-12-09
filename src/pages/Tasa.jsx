import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Tasa() {
  const navigate = useNavigate();
  const [tasa, setTasa] = useState("");

  // 🔹 Cargar la tasa desde localStorage al entrar
  useEffect(() => {
    const stored = localStorage.getItem("tasa");
    if (stored) {
      setTasa(stored);
    }
  }, []);

  const handleSave = () => {
    if (!tasa || isNaN(tasa)) {
      alert("Ingrese un valor numérico válido");
      return;
    }

    localStorage.setItem("tasa", tasa);
    alert("Tasa guardada correctamente");
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <h2 style={styles.title}>Tasa BCV</h2>

        <input
          type="text"
          value={tasa}
          onChange={(e) => setTasa(e.target.value)}
          placeholder="Ingrese la tasa"
          style={styles.input}
        />

        <div style={styles.buttonRow}>
          <button onClick={handleSave} style={styles.button}>
            Grabar
          </button>
          <button onClick={() => navigate("/panel")} style={styles.button}>
            Regresar
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    width: "100vw",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "100%",
    maxWidth: "400px",
    textAlign: "center",
  },
  title: {
    marginBottom: "24px",
    fontSize: "24px",
  },
  input: {
    width: "100%",
    padding: "10px",
    fontSize: "18px",
    marginBottom: "20px",
    borderRadius: "6px",
    border: "1px solid #ccc",
  },
  buttonRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
  },
  button: {
    flex: 1,
    padding: "10px",
    fontSize: "16px",
    cursor: "pointer",
    borderRadius: "6px",
    border: "1px solid #999",
    background: "#f4f4f4",
  },
};
