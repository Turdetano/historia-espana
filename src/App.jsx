import { db, auth } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
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

// 📸 CLOUDINARY OK
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

  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  // 🔥 EDITAR
  const [editingId, setEditingId] = useState(null);

  // 🔐 AUTH
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

  // 📚 LOAD
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
      if (!imageUrl) {
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

    resetForm();
    alert("✅ Artículo publicado");
  };

  // ✏️ INICIAR EDICIÓN
  const startEdit = (a) => {
    setTitle(a.title);
    setContent(a.content);
    setCategory(a.category);
    setEditingId(a.id);
  };

  // 💾 GUARDAR EDICIÓN
  const saveEdit = async () => {
    if (!editingId) return;

    let imageUrl = "";

    if (selectedImage) {
      imageUrl = await uploadImage(selectedImage);
    }

    await updateDoc(doc(db, "articles", editingId), {
      title,
      content,
      category,
      ...(imageUrl && { image: imageUrl })
    });

    window.location.reload(); // simple y efectivo
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setSelectedImage(null);
    setEditingId(null);
    setLoading(false);
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
      minHeight: "100vh",
      padding: 20,
      fontFamily: "Arial"
    }}>

      <h1 style={{ textAlign: "center" }}>📜 Historia de España</h1>

      {!user ? (
        <button onClick={login}>Iniciar sesión</button>
      ) : (
        <div style={{ textAlign: "center" }}>
          <p>👤 {user.email}</p>
          <button onClick={logout}>Cerrar sesión</button>
        </div>
      )}

      {/* 🔥 FORMULARIO MEJORADO */}
      {isEditor && (
        <div style={{
          marginTop: 30,
          background: "#fff",
          padding: 20,
          borderRadius: 10,
          boxShadow: "0 0 10px rgba(0,0,0,0.1)",
          maxWidth: 600,
          marginInline: "auto"
        }}>
          <h2>{editingId ? "✏️ Editar artículo" : "✍️ Crear artículo"}</h2>

          <input
            placeholder="Título"
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{ width: "100%", marginBottom: 10 }}
          />

          <textarea
            placeholder="Contenido"
            value={content}
            onChange={e => setContent(e.target.value)}
            style={{ width: "100%", marginBottom: 10 }}
          />

          <select value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>

          <br /><br />

          <label style={{
            background: "#334155",
            color: "#fff",
            padding: "10px",
            borderRadius: 6,
            cursor: "pointer"
          }}>
            📸 Imagen
            <input type="file" hidden
              onChange={e => setSelectedImage(e.target.files[0])}
            />
          </label>

          <br /><br />

          {!editingId ? (
            <button onClick={publish}>
              {loading ? "⏳..." : "🚀 Publicar"}
            </button>
          ) : (
            <button onClick={saveEdit}>
              💾 Guardar cambios
            </button>
          )}
        </div>
      )}

      {/* 📚 LISTA */}
      <div style={{ marginTop: 40 }}>
        {articles.map(a => (
          <div key={a.id} style={{
            background: "#fff",
            padding: 15,
            marginBottom: 15,
            borderRadius: 10
          }}>
            <h3>{a.title}</h3>

            {a.image && (
              <img src={a.image} style={{ width: "100%" }} />
            )}

            <p>{a.content}</p>

            {isEditor && (
              <>
                <button onClick={() => startEdit(a)}>✏️ Editar</button>
                <button onClick={() => remove(a.id)}>❌ Eliminar</button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}