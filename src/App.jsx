import { db, auth } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  getDoc
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

// 👉 CAMBIA AQUÍ TU TELEGRAM
const TELEGRAM_LINK = "https://t.me/Tartessos";

// 🎨 ESTILOS
const btnPrimary = {
  background: "#2563eb",
  color: "#fff",
  padding: "10px 16px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
  fontWeight: "bold"
};

const btnDanger = {
  background: "#dc2626",
  color: "#fff",
  padding: "10px 16px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer"
};

const btnSecondary = {
  background: "#64748b",
  color: "#fff",
  padding: "10px 16px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer"
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
  const [role, setRole] = useState("user");

  // 🔐 AUTH + ROLE
  useEffect(() => {
    onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (u) {
        const snap = await getDoc(doc(db, "users", u.uid));
        if (snap.exists()) setRole(snap.data().role);
      }
    });
  }, []);

  const isEditor = role === "admin" || role === "editor";

  // 📚 CARGAR
  useEffect(() => {
    getDocs(collection(db, "articles")).then(s =>
      setArticles(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, []);

  // 🚀 PUBLICAR / EDITAR
  const publish = async () => {
    if (!isEditor || loading) return;

    if (!title || !content) {
      alert("❌ Rellena título y contenido");
      return;
    }

    setLoading(true);

    let imageUrl = "";

    if (selectedImage) {
      imageUrl = await uploadImage(selectedImage);
      if (!imageUrl) return setLoading(false);
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
      author: user?.email || "anon"
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
    if (!confirm("¿Eliminar artículo?")) return;
    await deleteDoc(doc(db, "articles", id));
    setArticles(prev => prev.filter(a => a.id !== id));
  };

  const login = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);

  // 🔥 AGRUPAR POR CATEGORÍA
  const grouped = CATEGORIES.map(cat => ({
    name: cat,
    items: articles.filter(a => a.category === cat)
  }));

  return (
    <div style={{ background: "#f1f5f9", minHeight: "100vh", padding: 20 }}>

      <h1 style={{ textAlign: "center" }}>📜 Historia de España</h1>

      {/* TELEGRAM */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <a href={TELEGRAM_LINK} target="_blank" style={btnPrimary}>
          📢 Telegram
        </a>
      </div>

      {/* LOGIN */}
      {!user ? (
        <button onClick={login} style={btnPrimary}>
          Iniciar sesión
        </button>
      ) : (
        <div style={{ textAlign: "center" }}>
          <p>{user.email} ({role})</p>
          <button onClick={logout} style={btnDanger}>Cerrar sesión</button>
        </div>
      )}

      {/* FORM SOLO EDITOR */}
      {isEditor && (
        <div style={{
          background: "#fff",
          padding: 20,
          borderRadius: 10,
          margin: "30px auto",
          maxWidth: 600
        }}>
          <h2>{editingId ? "✏️ Editar" : "🆕 Crear artículo"}</h2>

          <input
            placeholder="Título"
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{ width: "100%", padding: 10 }}
          />

          <textarea
            placeholder="Contenido"
            value={content}
            onChange={e => setContent(e.target.value)}
            style={{ width: "100%", padding: 10, marginTop: 10 }}
          />

          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>

          <br /><br />

          {/* BOTÓN BONITO IMAGEN */}
          <label style={{
            ...btnSecondary,
            display: "inline-block"
          }}>
            📸 Seleccionar imagen
            <input
              type="file"
              hidden
              onChange={e => setSelectedImage(e.target.files[0])}
            />
          </label>

          {selectedImage && (
            <img src={URL.createObjectURL(selectedImage)} style={{ width: "100%", marginTop: 10 }} />
          )}

          <br /><br />

          <button onClick={publish} style={btnPrimary}>
            {editingId ? "Guardar" : "Publicar"}
          </button>
        </div>
      )}

      {/* ENLACES */}
      <div style={{ marginBottom: 30 }}>
        <h2>🔗 Enlaces de interés</h2>
        <ul>
          <li><a href="https://es.wikipedia.org/wiki/Historia_de_Espa%C3%B1a" target="_blank">Wikipedia</a></li>
          <li><a href="https://www.bne.es" target="_blank">Biblioteca Nacional</a></li>
        </ul>
      </div>

      {/* ARTÍCULOS POR CATEGORÍA */}
      {grouped.map(cat => (
        <div key={cat.name}>
          <h2>📚 {cat.name}</h2>

          {cat.items.map(a => (
            <div key={a.id} style={{
              background: "#fff",
              padding: 15,
              marginBottom: 10,
              borderRadius: 8
            }}>
              <h3>{a.title}</h3>
              {a.image && <img src={a.image} style={{ width: "100%" }} />}
              <p>{a.content}</p>

              {isEditor && (
                <>
                  <button onClick={() => startEdit(a)} style={btnPrimary}>Editar</button>
                  <button onClick={() => remove(a.id)} style={btnDanger}>Eliminar</button>
                </>
              )}
            </div>
          ))}
        </div>
      ))

      }

    </div>
  );
}