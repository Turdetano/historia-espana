import { db, auth } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
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

// 📸 SUBIR IMAGEN (ROBUSTO)
const uploadImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "historia_unsigned");

    const res = await fetch(
  "https://api.cloudinary.com/v1_1/djlv6e9o3/image/upload",
  {
    method: "POST",
    body: formData
  }
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

  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (u) {
        const snap = await getDoc(doc(db, "users", u.uid));
        setRole(snap.exists() ? snap.data().role : "user");
      } else {
        setRole(null);
      }
    });
  }, []);

  useEffect(() => {
    getDocs(collection(db, "articles")).then(s =>
      setArticles(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, []);

  const isEditor = role === "admin" || role === "editor";

  // 🚀 PUBLICAR
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

      if (imageUrl === null) {
        setLoading(false);
        return;
      }
    }

    const art = {
      title,
      content,
      category,
      image: imageUrl,
      date: new Date().toLocaleDateString(),
      author: user.email
    };

    const ref = await addDoc(collection(db, "articles"), art);

    setArticles([...articles, { ...art, id: ref.id }]);

    setTitle("");
    setContent("");
    setSelectedImage(null);
    setLoading(false);

    alert("✅ Artículo publicado");
  };

  const remove = async (id) => {
    await deleteDoc(doc(db, "articles", id));
    setArticles(articles.filter(a => a.id !== id));
  };

  const login = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);

  return (
    <div style={{
      background: "#f1f5f9",
      color: "#0f172a",
      minHeight: "100vh",
      padding: 20,
      fontFamily: "Arial"
    }}>
      
      <h1 style={{ textAlign: "center" }}>
        📜 Historia de España
      </h1>

      {!user ? (
        <button onClick={login} style={{
          background: "#2563eb",
          color: "#fff",
          padding: "10px 20px",
          borderRadius: 8,
          border: "none",
          cursor: "pointer",
          display: "block",
          margin: "20px auto",
          fontWeight: "bold"
        }}>
          Iniciar sesión
        </button>
      ) : (
        <div style={{ textAlign: "center" }}>
          <p>👤 {user.email}</p>

          <button onClick={logout} style={{
            background: "#dc2626",
            color: "#fff",
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer"
          }}>
            Cerrar sesión
          </button>
        </div>
      )}

      {isEditor && (
        <div style={{ marginTop: 30 }}>
          <h2>✍️ Crear artículo</h2>

          <input
            placeholder="Título"
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{ width: "100%", padding: 10, marginBottom: 10 }}
          />

          <textarea
            placeholder="Contenido"
            value={content}
            onChange={e => setContent(e.target.value)}
            style={{ width: "100%", padding: 10, marginBottom: 10 }}
          />

          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            style={{ padding: 8 }}
          >
            {CATEGORIES.map(c => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <br /><br />

          {/* BOTÓN BONITO PARA IMAGEN */}
          <label style={{
            background: "#334155",
            color: "#fff",
            padding: "10px 15px",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: "bold"
          }}>
            📸 Seleccionar imagen
            <input
              type="file"
              onChange={e => setSelectedImage(e.target.files[0])}
              style={{ display: "none" }}
            />
          </label>

          <br /><br />

          <button
            onClick={publish}
            disabled={loading}
            style={{
              background: loading ? "#94a3b8" : "#16a34a",
              color: "#fff",
              padding: "12px 20px",
              borderRadius: 8,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: "bold"
            }}
          >
            {loading ? "⏳ Subiendo..." : "🚀 Publicar artículo"}
          </button>
        </div>
      )}

      <div style={{ marginTop: 40 }}>
        <h2>📚 Artículos</h2>

        {articles.map(a => (
          <div key={a.id} style={{
            border: "1px solid #ccc",
            padding: 10,
            marginBottom: 10,
            background: "#fff"
          }}>
            <h3>{a.title}</h3>

            {a.image && (
              <img src={a.image} style={{ width: "100%" }} />
            )}

            <p>{a.content}</p>

            {isEditor && (
              <button onClick={() => remove(a.id)} style={{
                background: "#dc2626",
                color: "#fff",
                padding: "6px 12px",
                borderRadius: 6,
                border: "none",
                marginTop: 10
              }}>
                ❌ Eliminar
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}