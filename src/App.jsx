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

const ADMIN_UID = "PVBWPZUwVwZnwAnaA5F0a6UuqF83";

const CATEGORIES = [
  "Edad Antigua",
  "Edad Media",
  "Reconquista",
  "Imperio Español",
  "Edad Contemporánea"
];

// BOTONES
const btnPrimary = {
  background: "#1d4ed8",
  color: "#fff",
  padding: "12px 18px",
  borderRadius: 10,
  border: "none",
  cursor: "pointer",
  marginRight: 10,
  fontWeight: "bold"
};

const btnDanger = {
  background: "#b91c1c",
  color: "#fff",
  padding: "12px 18px",
  borderRadius: 10,
  border: "none",
  cursor: "pointer",
  fontWeight: "bold"
};

// CLOUDINARY
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
  const [adminMode, setAdminMode] = useState(false); // 🔐 NUEVO

  // AUTH
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      console.log("UID:", u?.uid);
    });

    return () => unsubscribe();
  }, []);

  // CARGAR ARTÍCULOS
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
      author: "Tartessos"
    };

    const ref = await addDoc(collection(db, "articles"), art);

    setArticles(prev => [...prev, { ...art, id: ref.id }]);

    try {
      await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content })
      });
    } catch {}

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
    <div style={{
      background: "#f1f5f9",
      minHeight: "100vh",
      padding: 20,
      fontFamily: "Segoe UI, Arial",
      color: "#111"
    }}>

      {/* TITULO + ACTIVADOR SECRETO */}
      <h1
        style={{
          textAlign: "center",
          fontSize: "36px",
          fontWeight: "900",
          color: "#000",
          cursor: "pointer"
        }}
        onClick={() => {
          const pass = prompt("Acceso administrador:");
          if (pass === "Hispania123") {
            setAdminMode(true);
            alert("Modo administrador activado");
          }
        }}
      >
        📜 Historia de España
      </h1>

      {/* TELEGRAM */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <a href="https://t.me/Hispania_Imperial" target="_blank" style={{
          background: "#0088cc",
          color: "#fff",
          padding: "12px 20px",
          borderRadius: 10,
          textDecoration: "none",
          fontWeight: "bold"
        }}>
          📢 Canal Hispania Imperial
        </a>
      </div>

      {/* LOGIN */}
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

      {/* ADMIN */}
      {user?.uid === ADMIN_UID && adminMode && (
        <div style={{
          background: "#fff",
          padding: 20,
          borderRadius: 10,
          maxWidth: 600,
          margin: "30px auto",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
        }}>
          <h2 style={{ fontWeight: "900", fontSize: "26px" }}>
            ✍️ Crear artículo
          </h2>

          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título" style={{ width: "100%", marginBottom: 10, padding: 10 }} />
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Contenido" style={{ width: "100%", marginBottom: 10, padding: 10 }} />

          <select value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>

          <br /><br />

          <label style={{ background: "#0f172a", color: "#fff", padding: 10, borderRadius: 6, cursor: "pointer" }}>
            📸 Subir imagen
            <input type="file" onChange={e => setSelectedImage(e.target.files[0])} style={{ display: "none" }} />
          </label>

          <br /><br />

          <button onClick={publish} style={btnPrimary}>
            🚀 Publicar
          </button>
        </div>
      )}

      {/* ARTÍCULOS */}
      {CATEGORIES.map(cat => (
        <div key={cat}>
          <h2 style={{ color: "#1d4ed8" }}>📚 {cat}</h2>

          {articles.filter(a => a.category === cat).map(a => (
            <div key={a.id} style={{ background: "#fff", padding: 15, marginBottom: 10 }}>
              <h3>{a.title}</h3>
              <p>{a.content}</p>

              {user?.uid === ADMIN_UID && adminMode && (
                <>
                  <button onClick={() => startEdit(a)} style={btnPrimary}>Editar</button>
                  <button onClick={() => remove(a.id)} style={btnDanger}>Eliminar</button>
                </>
              )}
            </div>
          ))}
        </div>
      ))}

      {/* ENLACES MEJORADOS */}
      <div style={{ marginTop: 40 }}>
        <h2 style={{ fontWeight: "900", fontSize: "24px" }}>
          🔗 Enlaces de interés
        </h2>

        {[
          { name: "Hispanopedia", url: "https://es.hispanopedia.com/wiki/Inicio" },
          { name: "Biblioteca Cervantes", url: "https://www.cervantesvirtual.com/" },
          { name: "Real Academia Española", url: "https://www.rae.es/" },
          { name: "Biblioteca Nacional de España", url: "https://www.bne.es/" },
          { name: "Real Academia de la Historia", url: "https://www.rah.es/" },
          { name: "Museo del Prado", url: "https://www.museodelprado.es/" },
          { name: "Biblioteca GHY", url: "https://bghyn.com/" }
        ].map(link => (
          <p key={link.name}>
            <a
              href={link.url}
              target="_blank"
              style={{
                fontWeight: "800",
                color: "#0f172a",
                textDecoration: "none"
              }}
              onMouseOver={e => e.target.style.color = "#1d4ed8"}
              onMouseOut={e => e.target.style.color = "#0f172a"}
            >
              {link.name}
            </a>
          </p>
        ))}
      </div>

    </div>
  );
}