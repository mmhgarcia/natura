// src/pages/TasaBCV.jsx
import { useTasaBCV } from "../lib/db/hooks/useTasaBCV";

export default function TasaBCV() {
  const { tasa, setTasa, saveTasa, loading } = useTasaBCV();

  function handleSubmit(e) {
    e.preventDefault();
    if (tasa === "") return;
    saveTasa(tasa);
  }

  if (loading) {
    return <div>Cargando tasa...</div>;
  }

  return (
    <div>
      <h1>Tasa BCV</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="number"
          step="0.01"
          placeholder="Ingresa tasa BCV"
          value={tasa}
          onChange={(e) => setTasa(e.target.value)}
        />

        <button type="submit">Grabar</button>
      </form>
    </div>
  );
}
