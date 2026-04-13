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

// 📸 CLOUDINARY (ROBUSTO)
const uploadImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "historia_unsigned");

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/dlv8e9o3/image/upload",
      {
        method: "POST",
        body: formData
      }
    );

    const data = await res.json();

    if (!data.secure_url) {
      throw new Error("Error subiendo imagen");
    }

    return data.secure_url;
  } catch (err) {
    alert("❌ Error al subir imagen");
    console.error(err);
    return null;
  }
};

export default function App() {
  const [articles, setArticles] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [selectedImage, setSelectedImage] = useState(null);

  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [editingId, setEditingId] = useState(null);

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

  // 🚀 PUBLICAR (ARREGLADO)
  const publish = async () => {
    if (!isEditor) return;

    if (!title || !content) {
      alert("❌ Rellena título y contenido");
      return;
    }

    let imageUrl = "";

    if (selectedImage) {
      imageUrl = await uploadImage(selectedImage);

      if (imageUrl === null) return; // ❗ evita publicar si falla imagen
    }

    const art = {
      title,
      content,
      category,
      image: imageUrl || "",
      date: new Date().toLocaleDateString(),
      author: user.email
    };

    const ref = await addDoc(collection(db, "articles"), art);

    setArticles([...articles, { ...art, id: ref.id }]);

    // reset limpio
    setTitle("");
    setContent("");
    setSelectedImage(null);

    alert("✅ Artículo publicado correctamente");
  };

  const startEdit = (article) => {
    setTitle(article.title);
    setContent(article.content);
    setCategory(article.category);
    setEditingId(article.id);
  };

  const saveEdit = async () => {
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

    window.location.reload();
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
          Iniciar sesión con Google
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
          <h2>✍️ {editingId ? "Editar artículo" : "Crear artículo"}</h2>

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
            style={{ width: "100%", padding: 10, minHeight: 120, marginBottom: 10 }}
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

          {/* BOTÓN IMAGEN ARREGLADO */}
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

          {!editingId ? (
            <button onClick={publish} style={{
              background: "#16a34a",
              color: "#fff",
              padding: "14px 22px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: 16
            }}>
              🚀 Publicar artículo
            </button>
          ) : (
            <button onClick={saveEdit} style={{
              background: "#f59e0b",
              color: "#fff",
              padding: "14px 22px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer"
            }}>
              Guardar cambios
            </button>
          )}
        </div>
      )}

      <div style={{ marginTop: 40 }}>
        <h2>📚 Artículos</h2>

        {articles.map(a => (
          <div key={a.id} style={{
            border: "1px solid #cbd5e1",
            padding: 15,
            marginBottom: 15,
            borderRadius: 10,
            background: "#ffffff"
          }}>
            <h3>{a.title}</h3>

            {a.image && (
              <img
                src={a.image}
                alt=""
                style={{
                  width: "100%",
                  maxHeight: 250,
                  objectFit: "cover",
                  borderRadius: 8,
                  marginBottom: 10
                }}
              />
            )}

            <p>{a.content}</p>
            <small>{a.category} | {a.date}</small>

            {isEditor && (
              <div style={{ marginTop: 10 }}>
                <button onClick={() => startEdit(a)} style={{
                  background: "#2563eb",
                  color: "#fff",
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "none",
                  marginRight: 10
                }}>
                  ✏️ Editar
                </button>

                <button onClick={() => remove(a.id)} style={{
                  background: "#dc2626",
                  color: "#fff",
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "none"
                }}>
                  ❌ Eliminar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}