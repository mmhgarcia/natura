// src/pages/Admin.jsx
import { useEffect, useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import dataProductos from "../data/data.json";
import dataGrupos from "../data/grupos.json";
import styles from "./Admin.module.css";

export default function Admin() {
  // Productos
  const [productos, setProductos] = useLocalStorage("productos", []);
  const [nuevoProducto, setNuevoProducto] = useState({ nombre: "", imagen: "", grupo: "" });

  // Grupos
  const [grupos, setGrupos] = useLocalStorage("grupos", []);
  const [nuevoGrupo, setNuevoGrupo] = useState({ nombre: "", precio: "" });

  // Inicialización
  useEffect(() => {
    if (productos.length === 0) setProductos(dataProductos.productos);
    if (grupos.length === 0) setGrupos(dataGrupos);
  }, []);

  // ------------------ PRODUCTOS ------------------
  const agregarProducto = () => {
    if (!nuevoProducto.nombre || !nuevoProducto.imagen || !nuevoProducto.grupo) return;
    const id = Date.now(); // id único
    setProductos([...productos, { id, ...nuevoProducto }]);
    setNuevoProducto({ nombre: "", imagen: "", grupo: "" });
  };

  const editarProducto = (index) => {
    const producto = productos[index];
    const nombre = prompt("Nombre:", producto.nombre);
    const imagen = prompt("URL Imagen:", producto.imagen);
    const grupo = prompt("Grupo:", producto.grupo);
    if (nombre !== null && imagen !== null && grupo !== null) {
      const productosActualizados = [...productos];
      productosActualizados[index] = { ...productosActualizados[index], nombre, imagen, grupo };
      setProductos(productosActualizados);
    }
  };

  const eliminarProducto = (index) => {
    if (confirm("¿Eliminar este producto?")) {
      const productosActualizados = productos.filter((_, i) => i !== index);
      setProductos(productosActualizados);
    }
  };

  // ------------------ GRUPOS ------------------
  const agregarGrupo = () => {
    if (!nuevoGrupo.nombre || !nuevoGrupo.precio) return;
    setGrupos([...grupos, { nombre: nuevoGrupo.nombre, precio: parseFloat(nuevoGrupo.precio) }]);
    setNuevoGrupo({ nombre: "", precio: "" });
  };

  const editarGrupo = (index) => {
    const grupo = grupos[index];
    const nombre = prompt("Nombre:", grupo.nombre);
    const precio = prompt("Precio:", grupo.precio);
    if (nombre !== null && precio !== null) {
      const gruposActualizados = [...grupos];
      gruposActualizados[index] = { nombre, precio: parseFloat(precio) };
      setGrupos(gruposActualizados);
    }
  };

  const eliminarGrupo = (index) => {
    if (confirm("¿Eliminar este grupo?")) {
      const gruposActualizados = grupos.filter((_, i) => i !== index);
      setGrupos(gruposActualizados);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Panel Admin - Productos y Grupos</h2>

      {/* ------------------ PRODUCTOS ------------------ */}
      <section className={styles.section}>
        <h3>Productos</h3>
        <div className={styles.form}>
          <input
            placeholder="Nombre"
            value={nuevoProducto.nombre}
            onChange={(e) => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })}
          />
          <input
            placeholder="URL Imagen"
            value={nuevoProducto.imagen}
            onChange={(e) => setNuevoProducto({ ...nuevoProducto, imagen: e.target.value })}
          />
          <select
            value={nuevoProducto.grupo}
            onChange={(e) => setNuevoProducto({ ...nuevoProducto, grupo: e.target.value })}
          >
            <option value="">Selecciona grupo</option>
            {grupos.map((g, i) => (
              <option key={i} value={g.nombre}>{g.nombre}</option>
            ))}
          </select>
          <button onClick={agregarProducto}>Agregar Producto</button>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Imagen</th>
              <th>Grupo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p, index) => (
              <tr key={p.id}>
                <td>{p.nombre}</td>
                <td><img src={p.imagen} alt={p.nombre} className={styles.imgMini} /></td>
                <td>{p.grupo}</td>
                <td>
                  <button onClick={() => editarProducto(index)}>Editar</button>
                  <button onClick={() => eliminarProducto(index)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ------------------ GRUPOS ------------------ */}
      <section className={styles.section}>
        <h3>Grupos</h3>
        <div className={styles.form}>
          <input
            placeholder="Nombre"
            value={nuevoGrupo.nombre}
            onChange={(e) => setNuevoGrupo({ ...nuevoGrupo, nombre: e.target.value })}
          />
          <input
            placeholder="Precio"
            type="number"
            value={nuevoGrupo.precio}
            onChange={(e) => setNuevoGrupo({ ...nuevoGrupo, precio: e.target.value })}
          />
          <button onClick={agregarGrupo}>Agregar Grupo</button>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Precio</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {grupos.map((g, index) => (
              <tr key={index}>
                <td>{g.nombre}</td>
                <td>{g.precio}</td>
                <td>
                  <button onClick={() => editarGrupo(index)}>Editar</button>
                  <button onClick={() => eliminarGrupo(index)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
