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
// ⚙️ CONFIG
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
  padding: "10px 16px",
  borderRadius: 10,
  border: "none",
  cursor: "pointer",
  fontWeight: "bold",
  margin: 5
};

const btnDanger = {
  background: "#b91c1c",
  color: "#fff",
  padding: "10px 16px",
  borderRadius: 10,
  border: "none",
  cursor: "pointer",
  fontWeight: "bold",
  margin: 5
};

// ==============================
// 🚀 APP
// ==============================

export default function App() {

  const [articles, setArticles] = useState([]);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [users, setUsers] = useState([]);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [editingId, setEditingId] = useState(null);

  const [view, setView] = useState("home");

  // ==============================
  // 🔐 PERMISOS
  // ==============================

  const canEditOrDelete = (article) => {
    if (!user) return false;
    if (role === "owner" || role === "admin") return true;
    return article.uid === user.uid;
  };

  // ==============================
  // 🔐 AUTH
  // ==============================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (u) {
        const ref = doc(db, "roles", u.uid);
        const snap = await getDoc(ref);

        if (u.uid === ADMIN_UID) setRole("owner");
        else if (snap.exists()) setRole(snap.data().role);
        else setRole("editor");

      } else setRole(null);
    });

    return () => unsubscribe();
  }, []);

  const login = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);

  // ==============================
  // 📚 ARTÍCULOS
  // ==============================

  useEffect(() => {
    getDocs(collection(db, "articles")).then(s =>
      setArticles(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, []);

  // ==============================
  // 🚀 PUBLICAR
  // ==============================

  const publish = async () => {
    if (!user) return alert("Debes iniciar sesión");
    if (!title || !content) return alert("Completa campos");

    if (editingId) {
      const article = articles.find(a => a.id === editingId);
      if (!canEditOrDelete(article)) return alert("Sin permisos");

      await updateDoc(doc(db, "articles", editingId), {
        title, content, category
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

    const snap = await getDocs(collection(db, "articles"));
    setArticles(snap.docs.map(d => ({ id: d.id, ...d.data() })));

    setTitle(""); setContent(""); setEditingId(null);
  };

  const startEdit = (a) => {
    if (!canEditOrDelete(a)) return alert("Sin permisos");

    setTitle(a.title);
    setContent(a.content);
    setCategory(a.category);
    setEditingId(a.id);
    setView("admin");
  };

  const remove = async (id) => {
    const article = articles.find(a => a.id === id);
    if (!canEditOrDelete(article)) return alert("Sin permisos");

    if (!confirm("¿Eliminar artículo?")) return;

    await deleteDoc(doc(db, "articles", id));

    const snap = await getDocs(collection(db, "articles"));
    setArticles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const sendToTelegram = async (a) => {
    if (!(role === "admin" || role === "owner"))
      return alert("Solo admin");

    if (!confirm("¿Enviar a Telegram?")) return;

    await fetch("/api/telegram", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(a)
    });

    alert("Enviado");
  };

  // ==============================
  // 🎨 UI
  // ==============================

  return (
    <div style={{
      background: "#f1f5f9",
      minHeight: "100vh",
      padding: 20,
      fontFamily: "Segoe UI"
    }}>

      <h1 style={{ textAlign: "center", fontSize: 36 }}>
        📜 Historia de España
      </h1>

      {/* 🧭 MENÚ */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <button style={btnPrimary} onClick={() => setView("home")}>🏠 Inicio</button>
        <button style={btnPrimary} onClick={() => setView("articles")}>📚 Épocas</button>
        <button style={btnPrimary} onClick={() => setView("links")}>🔗 Enlaces</button>
        {user && <button style={btnPrimary} onClick={() => setView("admin")}>⚙️ Admin</button>}
      </div>

      {/* LOGIN */}
      {!user ? (
        <div style={{ textAlign: "center" }}>
          <button style={btnPrimary} onClick={login}>Iniciar sesión</button>
        </div>
      ) : (
        <div style={{ textAlign: "center" }}>
          <p>{user.email}</p>
          <button style={btnDanger} onClick={logout}>Cerrar sesión</button>
        </div>
      )}

      {/* INICIO */}
      {view === "home" && (
        <div style={{ textAlign: "center", marginTop: 30 }}>
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/9/99/Coat_of_Arms_of_Charles_V%2C_Holy_Roman_Emperor.svg"
            style={{ maxWidth: 200 }}
          />
          <p>Explora la Historia de España</p>
        </div>
      )}

      {/* ARTÍCULOS */}
      {view === "articles" && CATEGORIES.map(cat => (
        <div key={cat}>
          <h2 style={{ color: "#1d4ed8" }}>{cat}</h2>

          {articles.filter(a => a.category === cat).map(a => (
            <div key={a.id} style={{
              background: "#fff",
              padding: 15,
              marginBottom: 10,
              borderRadius: 10
            }}>
              <h3>{a.title}</h3>
              <p>{a.content}</p>

              {a.image && <img src={a.image} style={{ maxWidth: "100%" }} />}

              {user && (
                <div>
                  <button onClick={() => startEdit(a)} style={btnPrimary}>Editar</button>
                  <button onClick={() => remove(a.id)} style={btnDanger}>Eliminar</button>
                  <button onClick={() => sendToTelegram(a)} style={btnPrimary}>Telegram</button>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}

      {/* ENLACES */}
      {view === "links" && (
        <div style={{ marginTop: 30 }}>
          <h2 style={{ fontWeight: "900" }}>🔗 Enlaces de interés</h2>

          {[
            { name: "Biblioteca Cervantes", url: "https://www.cervantesvirtual.com/" },
            { name: "RAE", url: "https://www.rae.es/" },
            { name: "BNE", url: "https://www.bne.es/" },
            { name: "RAH", url: "https://www.rah.es/" },
            { name: "Genealogía", url: "https://bghyn.com/" }
          ].map(l => (
            <p key={l.name}>
              <a href={l.url} target="_blank" style={{
                fontWeight: "bold",
                color: "#1d4ed8"
              }}>
                {l.name}
              </a>
            </p>
          ))}
        </div>
      )}

      {/* ADMIN */}
      {user && view === "admin" && (
        <div style={{
          background: "#fff",
          padding: 20,
          borderRadius: 10,
          marginTop: 20
        }}>
          <h2>Administración</h2>

          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título" style={{ width: "100%", marginBottom: 10 }} />
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Contenido" style={{ width: "100%", marginBottom: 10 }} />

          <select value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>

          <br /><br />

          <button onClick={publish} style={btnPrimary}>
            {editingId ? "Guardar cambios" : "Publicar"}
          </button>
        </div>
      )}

    </div>
  );
}