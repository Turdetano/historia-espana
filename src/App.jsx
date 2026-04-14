import { db, auth } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc
} from "firebase/firestore";
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import { useState, useEffect } from "react";

const provider = new GoogleAuthProvider();

const CATEGORIES = [
  "Edad Antigua",
  "Edad Media",
  "Reconquista",
  "Imperio Español",
  "Edad Contemporánea"
];

// 🎨 ESTILOS BOTONES
const btnPrimary = {
  background: "#2563eb",
  color: "#fff",
  padding: "10px 16px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
  marginRight: 10,
  fontWeight: "bold"
};

const btnDanger = {
  background: "#dc2626",
  color: "#fff",
  padding: "10px 16px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
  fontWeight: "bold"
};

const btnSecondary = {
  background: "#64748b",
  color: "#fff",
  padding: "10px 16px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
  fontWeight: "bold"
};

// 📸 CLOUDINARY
const uploadImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "historia_unsigned");

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/djlv6e9o3/image/upload",
      { method: "POST", body: formData }
    );

    const data = await res.json();
    if (!data.secure_url) throw new Error();

    return data.secure_url;
  } catch (err) {
    console.error(err);
    alert("❌ Error al subir imagen");
    return null;
  }
};

export default function App() {
  const [articles, setArticles] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [selectedImage, setSelectedImage] = useState(null);

  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [user, setUser] = useState(null);

  // 🔐 AUTH
  useEffect(() => {
    onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  // 📚 CARGAR
  useEffect(() => {
    getDocs(collection(db, "articles")).then(s =>
      setArticles(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, []);

  // 🚀 PUBLICAR / EDITAR
  const publish = async () => {
    if (loading) return;

    if (!title || !content) {
      alert("❌ Rellena título y contenido");
      return;
    }

    setLoading(true);

    let imageUrl = "";

    if (selectedImage) {
      imageUrl = await uploadImage(selectedImage);
      if (!imageUrl) {
        setLoading(false);
        return;
      }
    }

    // ✏️ EDITAR
    if (editingId) {
      await updateDoc(doc(db, "articles", editingId), {
        title,
        content,
        category,
        ...(imageUrl && { image: imageUrl })
      });

      setArticles(prev =>
        prev.map(a =>
          a.id === editingId
            ? { ...a, title, content, category, ...(imageUrl && { image: imageUrl }) }
            : a
        )
      );

      resetForm();
      alert("✅ Artículo actualizado");
      return;
    }

    // 🆕 CREAR
    const art = {
      title,
      content,
      category,
      image: imageUrl,
      date: new Date().toLocaleDateString(),
      author: user?.email || "anon"
    };

    const ref = await addDoc(collection(db, "articles"), art);

    setArticles(prev => [...prev, { ...art, id: ref.id }]);

    resetForm();
    alert("✅ Artículo publicado");
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setSelectedImage(null);
    setEditingId(null);
    setLoading(false);
  };

  // ✏️ EDITAR
  const startEdit = (a) => {
    setTitle(a.title);
    setContent(a.content);
    setCategory(a.category);
    setEditingId(a.id);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ❌ ELIMINAR
  const remove = async (id) => {
    const confirmDelete = confirm("¿Eliminar este artículo?");
    if (!confirmDelete) return;

    await deleteDoc(doc(db, "articles", id));
    setArticles(prev => prev.filter(a => a.id !== id));
  };

  const login = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);

  return (
    <div style={{
      background: "#f1f5f9",
      minHeight: "100vh",
      padding: 20,
      fontFamily: "Arial"
    }}>

      <h1 style={{ textAlign: "center" }}>📜 Historia de España</h1>

      {/* 📢 TELEGRAM */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <a
          href="https://t.me/TU_USUARIO"
          target="_blank"
          style={{
            background: "#0088cc",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: "bold"
          }}
        >
          📢 Ir a Telegram
        </a>
      </div>

      {!user ? (
        <button onClick={login} style={btnPrimary}>
          Iniciar sesión
        </button>
      ) : (
        <div style={{ textAlign: "center" }}>
          <p>👤 {user.email}</p>
          <button onClick={logout} style={btnDanger}>
            Cerrar sesión
          </button>
        </div>
      )}

      {/* FORMULARIO */}
      <div style={{
        background: "#fff",
        padding: 20,
        borderRadius: 10,
        marginTop: 30,
        maxWidth: 600,
        margin: "30px auto",
        boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
      }}>
        <h2>
          {editingId ? "✏️ Editando artículo..." : "✍️ Crear artículo"}
        </h2>

        <input
          placeholder="Título"
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={{ width: "100%", marginBottom: 10, padding: 10 }}
        />

        <textarea
          placeholder="Contenido"
          value={content}
          onChange={e => setContent(e.target.value)}
          style={{ width: "100%", marginBottom: 10, padding: 10 }}
        />

        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
        >
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>

        <br /><br />

        <input
          type="file"
          onChange={e => setSelectedImage(e.target.files[0])}
        />

        {selectedImage && (
          <img
            src={URL.createObjectURL(selectedImage)}
            style={{ width: "100%", marginTop: 10, borderRadius: 6 }}
          />
        )}

        <br /><br />

        <button onClick={publish} style={btnPrimary}>
          {editingId ? "💾 Guardar cambios" : "🚀 Publicar"}
        </button>

        {editingId && (
          <button onClick={resetForm} style={btnSecondary}>
            Cancelar
          </button>
        )}
      </div>

      {/* LISTA */}
      <div style={{ marginTop: 40 }}>
        {articles.map(a => (
          <div key={a.id} style={{
            background: "#fff",
            padding: 15,
            marginBottom: 15,
            borderRadius: 8,
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
          }}>
            <h3>{a.title}</h3>

            {a.image && (
              <img
                src={a.image}
                style={{ width: "100%", borderRadius: 6 }}
              />
            )}

            <p>{a.content}</p>

            <div style={{ marginTop: 10 }}>
              <button onClick={() => startEdit(a)} style={btnPrimary}>
                ✏️ Editar
              </button>

              <button onClick={() => remove(a.id)} style={btnDanger}>
                ❌ Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}