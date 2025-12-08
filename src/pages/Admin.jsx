import { useState, useEffect } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import styles from "./Admin.module.css";

export default function Admin() {
  const [productos, setProductos] = useLocalStorage("productos", []);
  const [grupos, setGrupos] = useLocalStorage("grupos", []);
  const [nuevoProducto, setNuevoProducto] = useState({ id: "", nombre: "", grupo: "" });
  const [nuevoGrupo, setNuevoGrupo] = useState({ nombre: "", precio: "" });

  // Inicializar arrays si vienen vacíos o no son arrays
  useEffect(() => {
    if (!Array.isArray(productos)) setProductos([]);
    if (!Array.isArray(grupos)) setGrupos([]);
  }, []);

  // --- PRODUCTOS ---
  const handleAddProducto = () => {
    if (!nuevoProducto.id || !nuevoProducto.nombre || !nuevoProducto.grupo) {
      alert("Completa todos los campos del producto");
      return;
    }
    setProductos([...productos, { ...nuevoProducto }]);
    setNuevoProducto({ id: "", nombre: "", grupo: "" });
  };

  const handleDeleteProducto = (id) => {
    setProductos(productos.filter((p) => p.id !== id));
  };

  // --- GRUPOS ---
  const handleAddGrupo = () => {
    if (!nuevoGrupo.nombre || !nuevoGrupo.precio) {
      alert("Completa todos los campos del grupo");
      return;
    }
    setGrupos([...grupos, { ...nuevoGrupo, precio: parseFloat(nuevoGrupo.precio) }]);
    setNuevoGrupo({ nombre: "", precio: "" });
  };

  const handleDeleteGrupo = (nombre) => {
    setGrupos(grupos.filter((g) => g.nombre !== nombre));
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Panel Admin - Productos y Grupos</h2>

      {/* --- Sección Productos --- */}
      <section className={styles.section}>
        <h3>Productos</h3>
        <div className={styles.form}>
          <input
            placeholder="ID"
            value={nuevoProducto.id}
            onChange={(e) => setNuevoProducto({ ...nuevoProducto, id: e.target.value })}
          />
          <input
            placeholder="Nombre"
            value={nuevoProducto.nombre}
            onChange={(e) => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })}
          />
          <select
            value={nuevoProducto.grupo}
            onChange={(e) => setNuevoProducto({ ...nuevoProducto, grupo: e.target.value })}
          >
            <option value="">Selecciona grupo</option>
            {Array.isArray(grupos) &&
              grupos.map((g) => (
                <option key={g.nombre} value={g.nombre}>
                  {g.nombre}
                </option>
              ))}
          </select>
          <button onClick={handleAddProducto}>Agregar Producto</button>
        </div>

        <ul className={styles.list}>
          {Array.isArray(productos) &&
            productos.map((p) => (
              <li key={p.id}>
                {p.id} - {p.nombre} ({p.grupo}){" "}
                <button onClick={() => handleDeleteProducto(p.id)}>Eliminar</button>
              </li>
            ))}
        </ul>
      </section>

      {/* --- Sección Grupos --- */}
      <section className={styles.section}>
        <h3>Grupos</h3>
        <div className={styles.form}>
          <input
            placeholder="Nombre grupo"
            value={nuevoGrupo.nombre}
            onChange={(e) => setNuevoGrupo({ ...nuevoGrupo, nombre: e.target.value })}
          />
          <input
            placeholder="Precio"
            type="number"
            value={nuevoGrupo.precio}
            onChange={(e) => setNuevoGrupo({ ...nuevoGrupo, precio: e.target.value })}
          />
          <button onClick={handleAddGrupo}>Agregar Grupo</button>
        </div>

        <ul className={styles.list}>
          {Array.isArray(grupos) &&
            grupos.map((g) => (
              <li key={g.nombre}>
                {g.nombre} - ${g.precio.toFixed(2)}{" "}
                <button onClick={() => handleDeleteGrupo(g.nombre)}>Eliminar</button>
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}
