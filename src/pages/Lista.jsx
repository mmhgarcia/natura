import { useLocalStorageList } from "../hooks/useLocalStorageList";

function Lista() {
  const { data } = useLocalStorageList("productos", []);

  return (
    <div>
      <h2>Lista de Helados</h2>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
        {data.map((producto) => (
          <div key={producto.id} style={{ width: "150px" }}>
            <img
              src={producto.imagen}
              alt={producto.nombre}
              style={{ width: "100%", borderRadius: "8px" }}
            />
            <p>{producto.nombre}</p>
            <small>{producto.grupo}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Lista;
