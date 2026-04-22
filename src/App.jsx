import { db, auth } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
  setDoc
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

// 📤 TELEGRAM
const sendToTelegram = async (article) => {
  try {
    const res = await fetch("/api/telegram", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(article)
    });

    const data = await res.json();
    if (data.ok) alert("✅ Enviado a Telegram");
    else alert("❌ Error en Telegram");
  } catch {
    alert("❌ Error conexión Telegram");
  }
};

// ☁️ CLOUDINARY
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
  const [editingId, setEditingId] = useState(null);

  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loadingRole, setLoadingRole] = useState(true);

  // 🔐 AUTH + ROLES
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (u) {
        const ref = doc(db, "roles", u.uid);
        const snap = await getDoc(ref);

        if (u.uid === ADMIN_UID) setRole("owner");
        else if (snap.exists()) setRole(snap.data().role);
        else setRole("viewer");
      } else {
        setRole(null);
      }

      setLoadingRole(false);
    });

    return () => unsubscribe();
  }, []);

  // 📚 CARGAR ARTÍCULOS
  useEffect(() => {
    getDocs(collection(db, "articles")).then(s =>
      setArticles(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, []);

  // ✍️ PUBLICAR / EDITAR
  const publish = async () => {
    if (!title || !content) {
      alert("❌ Rellena título y contenido");
      return;
    }

    let imageUrl = "";

    if (selectedImage) {
      imageUrl = await uploadImage(selectedImage);
      if (!imageUrl) return;
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
      author: user?.email || "Anónimo",
      authorId: user?.uid || ""
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
  };

  const startEdit = (a) => {
    setTitle(a.title);
    setContent(a.content);
    setCategory(a.category);
    setEditingId(a.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 🗑 BORRAR
  const remove = async (a) => {
    const confirmDelete = window.confirm(
      `⚠️ ¿Eliminar este artículo?\n\n${a.title}`
    );
    if (!confirmDelete) return;

    await deleteDoc(doc(db, "articles", a.id));
    setArticles(prev => prev.filter(x => x.id !== a.id));
  };

  // 🔐 ROLES
  const addAdmin = async () => {
    const uid = prompt("UID del usuario:");
    if (!uid) return;

    await setDoc(doc(db, "roles", uid), { role: "admin" });
    alert("✅ Admin añadido");
  };

  const addEditor = async () => {
    const uid = prompt("UID del usuario:");
    if (!uid) return;

    await setDoc(doc(db, "roles", uid), { role: "editor" });
    alert("✅ Editor añadido");
  };

  const login = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);

  if (loadingRole) {
    return <p style={{ textAlign: "center" }}>Cargando...</p>;
  }

  return (
    <div style={{
      background: "#f1f5f9",
      minHeight: "100vh",
      padding: 20,
      fontFamily: "Segoe UI, Arial",
      color: "#111"
    }}>

      <h1 style={{
        textAlign: "center",
        fontSize: "36px",
        fontWeight: "900",
        color: "#020617"
      }}>
        📜 Historia de España
      </h1>

      {!user ? (
        <button onClick={login} style={btnPrimary}>
          Iniciar sesión
        </button>
      ) : (
        <div style={{ textAlign: "center" }}>
          <p>👤 {user.email}</p>
          <p style={{ fontSize: 12, color: "#334155" }}>
            UID: {user.uid}
          </p>
          <button onClick={logout} style={btnDanger}>
            Cerrar sesión
          </button>
        </div>
      )}

      {role === "owner" && (
        <div style={{ textAlign: "center", marginTop: 10 }}>
          <button onClick={addAdmin} style={btnPrimary}>
            ➕ Añadir Admin
          </button>
          <button onClick={addEditor} style={btnPrimary}>
            ➕ Añadir Editor
          </button>
        </div>
      )}

      {(role === "owner" || role === "admin" || role === "editor") && (
        <div style={{
          background: "#fff",
          padding: 20,
          borderRadius: 10,
          maxWidth: 600,
          margin: "30px auto",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
        }}>
          <h2 style={{ fontSize: "26px", fontWeight: "900", color: "#020617" }}>
            ✍️ {editingId ? "Editar artículo" : "Crear artículo"}
          </h2>

          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Título"
            style={{ width: "100%", marginBottom: 10, padding: 10 }}
          />

          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Contenido"
            style={{ width: "100%", marginBottom: 10, padding: 10 }}
          />

          <select value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>

          <br /><br />

          <input type="file" onChange={e => setSelectedImage(e.target.files[0])} />

          <br /><br />

          <button onClick={publish} style={btnPrimary}>
            🚀 {editingId ? "Actualizar" : "Publicar"}
          </button>
        </div>
      )}

      {CATEGORIES.map(cat => (
        <div key={cat}>
          <h2 style={{ color: "#1d4ed8" }}>📚 {cat}</h2>

          {articles.filter(a => a.category === cat).map(a => (
            <div key={a.id} style={{
              background: "#fff",
              padding: 15,
              marginBottom: 15,
              borderRadius: 10
            }}>
              <h3>{a.title}</h3>

              {/* ✅ IMAGEN CORRECTAMENTE INTEGRADA */}
              {a.image && (
                <img
                  src={a.image}
                  alt="imagen"
                  style={{
                    width: "100%",
                    maxHeight: "300px",
                    objectFit: "cover",
                    borderRadius: "10px",
                    marginBottom: "10px"
                  }}
                />
              )}

              <p>{a.content}</p>

              <button onClick={() => startEdit(a)} style={btnPrimary}>Editar</button>
              <button onClick={() => sendToTelegram(a)} style={btnPrimary}>Telegram</button>
              <button onClick={() => remove(a)} style={btnDanger}>Eliminar</button>
            </div>
          ))}
        </div>
      ))}

      <div style={{ marginTop: 40 }}>
        <h2 style={{
          fontWeight: "900",
          fontSize: "26px",
          color: "#020617",
          background: "#e2e8f0",
          padding: "10px",
          borderRadius: "8px",
          display: "inline-block"
        }}>
          🔗 Enlaces de interés
        </h2>

        <p><a href="https://es.hispanopedia.com/wiki/Inicio" target="_blank" style={{ fontWeight: "bold", color: "#1d4ed8" }}>Hispanopedia</a></p>
        <p><a href="https://www.cervantesvirtual.com/" target="_blank" style={{ fontWeight: "bold", color: "#1d4ed8" }}>Biblioteca Cervantes</a></p>
        <p><a href="https://www.rae.es/" target="_blank" style={{ fontWeight: "bold", color: "#1d4ed8" }}>Real Academia Española</a></p>
        <p><a href="https://www.bne.es/" target="_blank" style={{ fontWeight: "bold", color: "#1d4ed8" }}>Biblioteca Nacional de España</a></p>
        <p><a href="https://bghyn.com/" target="_blank" style={{ fontWeight: "bold", color: "#1d4ed8" }}>Genealogía</a></p>
        <p><a href="https://www.rah.es/" target="_blank" style={{ fontWeight: "bold", color: "#1d4ed8" }}>Real Academia de la Historia</a></p>
      </div>

    </div>
  );
}