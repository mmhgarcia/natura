import { useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import styles from "./Admin.module.css";

export default function Admin() {
  const [productos, setProductos] = useLocalStorage("productos", []);
  const [editing, setEditing] = useState(null); // producto en edición
  const [form, setForm] = useState({
    id: "",
    nombre: "",
    imagen: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const startEdit = (p) => {
    setEditing(p.id);
    setForm({
      id: p.id,
      nombre: p.nombre,
      imagen: p.imagen
    });
  };

  const resetForm = () => {
    setEditing(null);
    setForm({ id: "", nombre: "", imagen: "" });
  };

  const saveProduct = () => {
    if (!form.id || !form.nombre) {
      alert("ID y Nombre son obligatorios");
      return;
    }

    if (editing) {
      // actualizar
      setProductos(
        productos.map((p) =>
          p.id === editing ? { ...p, ...form } : p
        )
      );
    } else {
      // crear nuevo
      setProductos([...productos, { ...form }]);
    }

    resetForm();
  };

  const deleteProduct = (id) => {
    if (confirm("¿Eliminar producto?")) {
      setProductos(productos.filter((p) => p.id !== id));
    }
  };

  return (
    <div className={styles.adminContainer}>
      <h2>Panel de Administración</h2>

      {/* FORMULARIO */}
      <div className={styles.formBox}>
        <h3>{editing ? "Editar Producto" : "Nuevo Producto"}</h3>

        <label>ID:</label>
        <input
          name="id"
          type="text"
          value={form.id}
          onChange={handleChange}
          disabled={editing} // no se edita ID
        />

        <label>Nombre:</label>
        <input
          name="nombre"
          type="text"
          value={form.nombre}
          onChange={handleChange}
        />

        <label>URL Imagen:</label>
        <input
          name="imagen"
          type="text"
          value={form.imagen}
          onChange={handleChange}
        />

        <button className={styles.saveBtn} onClick={saveProduct}>
          {editing ? "Guardar Cambios" : "Agregar Producto"}
        </button>

        {editing && (
          <button className={styles.cancelBtn} onClick={resetForm}>
            Cancelar
          </button>
        )}
      </div>

      {/* LISTADO */}
      <h3>Productos Registrados</h3>

      <div className={styles.list}>
        {productos.map((p) => (
          <div key={p.id} className={styles.item}>
            <img src={p.imagen} alt="" />

            <div className={styles.info}>
              <p><strong>{p.id}</strong></p>
              <p>{p.nombre}</p>
            </div>

            <div className={styles.actions}>
              <button onClick={() => startEdit(p)}>Editar</button>
              <button onClick={() => deleteProduct(p.id)}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
