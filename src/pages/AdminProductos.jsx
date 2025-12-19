import { useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import styles from "./Admin.module.css";
// En cualquier archivo de tu proyecto
import { db } from '../lib/db/database.js';

export default function AdminProductos() {
  const [productos, setProductos] = useLocalStorage("productos", []);
  const [isEditing, setIsEditing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // FORM STATE
  const [form, setForm] = useState({
    id: "",
    nombre: "",
    grupo: "",
    imagen: "",
    stock: ""
  });

  async function initApp() {    
    await db.init();
  }

  initApp();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const openNewProduct = () => {
    setForm({ id: "", nombre: "", grupo: "", imagen: "", stock: "" });
    setIsEditing(false);
    setShowModal(true);
  };

  const startEdit = (p) => {
    setForm(p);
    setIsEditing(true);
    setShowModal(true);
  };

  const saveProduct = () => {
    if (!form.nombre || !form.imagen) return alert("Faltan datos");

    if (isEditing) {
      const updated = productos.map((p) =>
        p.id === form.id ? form : p
      );
      setProductos(updated);
    } else {
      setProductos([...productos, { ...form, id: crypto.randomUUID() }]);
    }

    setShowModal(false);
  };

  const deleteProduct = (id) => {
    if (!confirm("¿Eliminar producto?")) return;
    setProductos(productos.filter((p) => p.id !== id));
  };

  return (
    <div className={styles.adminContainer}>
      <h2>PANEL DE PRODUCTOS</h2>

      {/* BOTÓN NUEVO */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <button className={styles.saveBtn} onClick={openNewProduct}>
          Nuevo Producto
        </button>
      </div>

      {/* LISTA */}
      <h3>Productos Registrados</h3>

      <div className={styles.list}>
        {productos
          .filter((p) => p.stock > 0)
          .map((p) => (
            <div key={p.id} className={styles.item}>
              <img src={p.imagen} alt="" />

              <div className={styles.info}>
                <p><strong>{p.id}</strong></p>
                <p>{p.nombre}</p>
                <p>{p.grupo}</p>
                <p>{p.stock}</p>
              </div>

              <div className={styles.actions}>
                <button onClick={() => startEdit(p)}>Edit</button>
                <button onClick={() => deleteProduct(p.id)}>Del</button>
              </div>
            </div>
          ))}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>

            <h3>{isEditing ? "Editar Producto" : "Nuevo Producto"}</h3>

            <div className={styles.formBox}>
              <input
                name="id"
                value={form.id}
                onChange={handleChange}
                placeholder="ID"
              />
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Nombre"
              />
              <input
                name="grupo"
                value={form.grupo}
                onChange={handleChange}
                placeholder="Grupo"
              />
              <input
                name="imagen"
                value={form.imagen}
                onChange={handleChange}
                placeholder="URL Imagen"
              />
              <input
                name="stock"
                value={form.stock}
                onChange={handleChange}
                placeholder="Stock"
              />

              <button className={styles.saveBtn} onClick={saveProduct}>
                Guardar
              </button>

              <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>
                Cancelar
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
