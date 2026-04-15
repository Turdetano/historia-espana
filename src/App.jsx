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

// 🎨 BOTONES PRO
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
  } catch {
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

  useEffect(() => {
    onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  useEffect(() => {
    getDocs(collection(db, "articles")).then(s =>
      setArticles(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, []);

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
      return;
    }

    const art = {
      title,
      content,
      category,
      image: imageUrl,
      date: new Date().toLocaleDateString(),
      author: user?.email || "Tartessos"
    };

    const ref = await addDoc(collection(db, "articles"), art);

    setArticles(prev => [...prev, { ...art, id: ref.id }]);

    resetForm();
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setSelectedImage(null);
    setEditingId(null);
    setLoading(false);
  };

  const startEdit = (a) => {
    setTitle(a.title);
    setContent(a.content);
    setCategory(a.category);
    setEditingId(a.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (id) => {
    if (!confirm("¿Eliminar este artículo?")) return;
    await deleteDoc(doc(db, "articles", id));
    setArticles(prev => prev.filter(a => a.id !== id));
  };

  const login = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);

  return (
    <div style={{ background: "#f1f5f9", minHeight: "100vh", padding: 20 }}>

      <h1 style={{ textAlign: "center" }}>📜 Historia de España</h1>

      {/* TELEGRAM PRO */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <a
          href="https://t.me/Hispania_Imperial"
          target="_blank"
          style={{
            display: "inline-block",
            background: "#0088cc",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: 10,
            textDecoration: "none",
            fontWeight: "bold"
          }}
        >
          📢 Canal Hispania Imperial (Tartessos)
        </a>
      </div>

      {!user ? (
        <button onClick={login} style={btnPrimary}>
          Iniciar sesión
        </button>
      ) : (
        <div style={{ textAlign: "center" }}>
          <p>👤 Tartessos</p>
          <button onClick={logout} style={btnDanger}>
            Cerrar sesión
          </button>
        </div>
      )}

      {/* FORM */}
      <div style={{
        background: "#fff",
        padding: 20,
        borderRadius: 10,
        maxWidth: 600,
        margin: "30px auto"
      }}>
        <h2>{editingId ? "✏️ Editando..." : "✍️ Crear artículo"}</h2>

        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título" style={{ width: "100%", marginBottom: 10 }} />

        <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Contenido" style={{ width: "100%", marginBottom: 10 }} />

        <select value={category} onChange={e => setCategory(e.target.value)}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>

        <br /><br />

        {/* BOTÓN IMAGEN BONITO */}
        <label style={btnSecondary}>
          📸 Seleccionar imagen
          <input type="file" hidden onChange={e => setSelectedImage(e.target.files[0])} />
        </label>

        {selectedImage && (
          <img src={URL.createObjectURL(selectedImage)} style={{ width: "100%", marginTop: 10 }} />
        )}

        <br /><br />

        <button onClick={publish} style={btnPrimary}>
          {editingId ? "💾 Guardar" : "🚀 Publicar"}
        </button>

        {editingId && (
          <button onClick={resetForm} style={btnSecondary}>
            Cancelar
          </button>
        )}
      </div>

      {/* 🔥 ARTÍCULOS POR CATEGORÍA */}
      {CATEGORIES.map(cat => (
        <div key={cat} style={{ marginTop: 40 }}>
          <h2>📚 {cat}</h2>

          {articles.filter(a => a.category === cat).map(a => (
            <div key={a.id} style={{
              background: "#fff",
              padding: 15,
              marginBottom: 15,
              borderRadius: 8
            }}>
              <h3>{a.title}</h3>

              {a.image && <img src={a.image} style={{ width: "100%" }} />}

              <p>{a.content}</p>

              <button onClick={() => startEdit(a)} style={btnPrimary}>✏️ Editar</button>
              <button onClick={() => remove(a.id)} style={btnDanger}>❌ Eliminar</button>
            </div>
          ))}
        </div>
      ))}

      {/* 🔗 ENLACES */}
      <div style={{ marginTop: 50 }}>
        <h2>🔗 Enlaces de interés</h2>

        <ul>
          <li><a href="https://es.wikipedia.org/wiki/Historia_de_Espa%C3%B1a" target="_blank">Historia de España (Wikipedia)</a></li>
          <li><a href="https://www.cervantesvirtual.com/" target="_blank">Biblioteca Cervantes</a></li>
        </ul>
      </div>

    </div>
  );
}