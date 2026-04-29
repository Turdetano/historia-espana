// ==============================
// 📦 IMPORTACIONES
// ==============================

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

// ==============================
// ⚙️ CONFIGURACIÓN
// ==============================

const provider = new GoogleAuthProvider();
const ADMIN_UID = "PVBWPZUwVwZnwAnaA5F0a6UuqF83";

const CATEGORIES = [
  "Edad Antigua",
  "Edad Media",
  "Reconquista",
  "Imperio Español",
  "Edad Contemporánea"
];

// ==============================
// 🎨 ESTILOS
// ==============================

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

// ==============================
// 🚀 COMPONENTE PRINCIPAL
// ==============================

export default function App() {

  // ==============================
  // 📊 ESTADOS
  // ==============================

  const [articles, setArticles] = useState([]);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [editingId, setEditingId] = useState(null);

  // 🧭 NAVEGACIÓN
  const [view, setView] = useState("home");

  // ==============================
  // 🔐 SEGURIDAD
  // ==============================

  const checkAuth = () => {
    if (!user) {
      alert("🔒 Debes iniciar sesión");
      return false;
    }
    return true;
  };

  const canEditOrDelete = (article) => {
    if (!user) return false;
    if (role === "owner" || role === "admin") return true;
    return article.uid === user.uid;
  };

  // ==============================
  // 🔐 AUTH + ROLES
  // ==============================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (u) {
        try {
          const ref = doc(db, "roles", u.uid);
          const snap = await getDoc(ref);

          if (u.uid === ADMIN_UID) {
            setRole("owner");
          } else if (snap.exists()) {
            setRole(snap.data().role);
          } else {
            setRole("editor");
          }

        } catch {
          setRole("editor");
        }
      } else {
        setRole(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);

  // ==============================
  // 📚 CARGA ARTÍCULOS
  // ==============================

  useEffect(() => {
    getDocs(collection(db, "articles")).then(s =>
      setArticles(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, []);

  // ==============================
  // 🚀 PUBLICAR / EDITAR
  // ==============================

  const publish = async () => {
    if (!checkAuth()) return;

    if (!title || !content) {
      alert("❌ Rellena título y contenido");
      return;
    }

    if (editingId) {
      const article = articles.find(a => a.id === editingId);

      if (!canEditOrDelete(article)) return alert("Sin permisos");

      await updateDoc(doc(db, "articles", editingId), {
        title,
        content,
        category
      });

    } else {
      await addDoc(collection(db, "articles"), {
        title,
        content,
        category,
        date: new Date().toLocaleDateString(),
        author: user.email,
        uid: user.uid
      });
    }

    const snapshot = await getDocs(collection(db, "articles"));
    setArticles(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));

    resetForm();
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setEditingId(null);
  };

  const startEdit = (a) => {
    if (!checkAuth()) return;

    if (!canEditOrDelete(a)) return alert("Sin permisos");

    setTitle(a.title);
    setContent(a.content);
    setCategory(a.category);
    setEditingId(a.id);

    setView("admin"); // 🔥 importante
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (id) => {
    if (!checkAuth()) return;

    const article = articles.find(a => a.id === id);

    if (!canEditOrDelete(article)) return alert("Sin permisos");

    if (!confirm("¿Eliminar este artículo?")) return;

    await deleteDoc(doc(db, "articles", id));

    const snapshot = await getDocs(collection(db, "articles"));
    setArticles(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  // ==============================
  // 📤 TELEGRAM
  // ==============================

  const sendToTelegram = async (a) => {
    if (!checkAuth()) return;

    if (!confirm("¿Enviar a Telegram?")) return;

    await fetch("/api/telegram", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(a)
    });

    alert("✅ Enviado");
  };

  // ==============================
  // 🎨 INTERFAZ
  // ==============================

  return (
    <div style={{
      background: "#f1f5f9",
      minHeight: "100vh",
      padding: 20,
      fontFamily: "Segoe UI, Arial",
      color: "#111"
    }}>

      {/* 🏛️ TÍTULO */}
      <h1 style={{
        textAlign: "center",
        fontSize: "36px",
        fontWeight: "900",
        color: "#020617"
      }}>
        📜 Historia de España
      </h1>

      {/* 🧭 MENÚ */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <button style={btnPrimary} onClick={() => setView("home")}>🏠 Inicio</button>
        <button style={btnPrimary} onClick={() => setView("articles")}>📚 Épocas</button>
        <button style={btnPrimary} onClick={() => setView("links")}>🔗 Enlaces</button>
        {user && (
          <button style={btnPrimary} onClick={() => setView("admin")}>
            ⚙️ Administración
          </button>
        )}
      </div>

      {/* 🔐 LOGIN */}
      {!user ? (
        <div style={{ textAlign: "center" }}>
          <button onClick={login} style={btnPrimary}>
            Iniciar sesión
          </button>
        </div>
      ) : (
        <div style={{ textAlign: "center" }}>
          <p>👤 {user.email}</p>
          <button onClick={logout} style={btnDanger}>
            Cerrar sesión
          </button>
        </div>
      )}

      {/* 🏠 INICIO */}
      {view === "home" && (
        <div style={{ textAlign: "center", marginTop: 30 }}>
          <h2>Bienvenido a Historia de España</h2>

          <img
            src="https://upload.wikimedia.org/wikipedia/commons/9/99/Coat_of_Arms_of_Charles_V%2C_Holy_Roman_Emperor.svg"
            style={{ maxWidth: "220px", marginTop: 20 }}
          />

          <p style={{ marginTop: 20 }}>
            Explora las épocas y los contenidos históricos.
          </p>
        </div>
      )}

      {/* 📚 ARTÍCULOS */}
      {view === "articles" && CATEGORIES.map(cat => (
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
              <p>{a.content}</p>

              {a.image && (
                <img src={a.image} style={{ maxWidth: "100%", marginTop: 10 }} />
              )}

              {user && (
                <div style={{ marginTop: 10 }}>
                  <button onClick={() => startEdit(a)} style={btnPrimary}>Editar</button>
                  <button onClick={() => remove(a.id)} style={btnDanger}>Eliminar</button>
                  <button onClick={() => sendToTelegram(a)} style={btnPrimary}>Telegram</button>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}

      {/* 🔗 ENLACES */}
      {view === "links" && (
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

          <div style={{ marginTop: 15 }}>
            {[
              { name: "Hispanopedia", url: "https://es.hispanopedia.com/wiki/Inicio" },
              { name: "Biblioteca Cervantes", url: "https://www.cervantesvirtual.com/" },
              { name: "Real Academia Española", url: "https://www.rae.es/" },
              { name: "Biblioteca Nacional de España", url: "https://www.bne.es/" },
              { name: "Genealogía", url: "https://bghyn.com/" },
              { name: "Real Academia de la Historia", url: "https://www.rah.es/" }
            ].map(link => (
              <p key={link.name}>
                <a href={link.url} target="_blank" style={{
                  fontWeight: "900",
                  color: "#0f172a",
                  fontSize: "16px"
                }}>
                  {link.name}
                </a>
              </p>
            ))}
          </div>
        </div>
      )}

      {/* ⚙️ ADMIN */}
      {user && view === "admin" && (
        <div style={{
          background: "#ffffff",
          padding: 25,
          borderRadius: 12,
          maxWidth: 600,
          margin: "30px auto",
          boxShadow: "0 6px 18px rgba(0,0,0,0.2)"
        }}>
          <h2>✍️ Crear artículo</h2>

          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título" style={{ width: "100%", marginBottom: 10, padding: 10 }} />
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Contenido" style={{ width: "100%", marginBottom: 10, padding: 10 }} />

          <select value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>

          <br /><br />

          <button onClick={publish} style={btnPrimary}>
            {editingId ? "💾 Guardar cambios" : "🚀 Publicar"}
          </button>
        </div>
      )}

    </div>
  );
}