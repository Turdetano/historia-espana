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
  updateDoc
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

const CATEGORIES = [
  "Edad Antigua",
  "Edad Media",
  "Reconquista",
  "Imperio Español",
  "Edad Contemporánea"
];

// ==============================
// 🚀 APP
// ==============================

export default function App() {

  const [articles, setArticles] = useState([]);
  const [user, setUser] = useState(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [editingId, setEditingId] = useState(null);

  // ==============================
  // 🔐 AUTH
  // ==============================

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return () => unsub();
  }, []);

  const login = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);

  // ==============================
  // 📚 LOAD ARTICLES
  // ==============================

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    const snap = await getDocs(collection(db, "articles"));
    setArticles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  // ==============================
  // 🚀 PUBLICAR / EDITAR
  // ==============================

  const publish = async () => {

    if (!user) {
      alert("Debes iniciar sesión");
      return;
    }

    if (!title || !content) {
      alert("Rellena todos los campos");
      return;
    }

    if (editingId) {

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
        author: user.email
      });
    }

    setTitle("");
    setContent("");
    setEditingId(null);

    loadArticles();
  };

  // ==============================
  // ✏️ EDITAR
  // ==============================

  const startEdit = (a) => {
    setTitle(a.title);
    setContent(a.content);
    setCategory(a.category);
    setEditingId(a.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ==============================
  // 🗑 ELIMINAR
  // ==============================

  const remove = async (id) => {

    if (!confirm("¿Eliminar artículo?")) return;

    await deleteDoc(doc(db, "articles", id));
    loadArticles();
  };

  // ==============================
  // 📤 TELEGRAM
  // ==============================

  const sendToTelegram = async (a) => {

    if (!confirm("¿Enviar a Telegram?")) return;

    await fetch("/api/telegram", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
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
      fontFamily: "Segoe UI",
      color: "#111"
    }}>

      <h1 style={{ textAlign: "center" }}>
        📜 Historia de España
      </h1>

      {/* LOGIN */}
      {!user ? (
        <div style={{ textAlign: "center" }}>
          <button onClick={login}>Iniciar sesión</button>
        </div>
      ) : (
        <div style={{ textAlign: "center" }}>
          <p>{user.email}</p>
          <button onClick={logout}>Cerrar sesión</button>
        </div>
      )}

      {/* FORM */}
      {user && (
        <div style={{
          background: "#fff",
          padding: 20,
          margin: "20px auto",
          maxWidth: 600,
          borderRadius: 10
        }}>

          <h2>Crear artículo</h2>

          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Título"
            style={{ width: "100%", marginBottom: 10 }}
          />

          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Contenido"
            style={{ width: "100%", marginBottom: 10 }}
          />

          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>

          <br /><br />

          <button onClick={publish}>
            {editingId ? "Guardar cambios" : "Publicar"}
          </button>

        </div>
      )}

      {/* 📚 ARTÍCULOS POR ÉPOCA */}
      {CATEGORIES.map(cat => (
        <div key={cat}>

          <h2 style={{
            color: "#1d4ed8",
            marginTop: 30
          }}>
            📚 {cat}
          </h2>

          {articles
            .filter(a => a.category === cat)
            .map(a => (
              <div key={a.id} style={{
                background: "#fff",
                padding: 15,
                marginBottom: 15,
                borderRadius: 10
              }}>

                <h3>{a.title}</h3>
                <p>{a.content}</p>

                {a.image && (
                  <img
                    src={a.image}
                    style={{ maxWidth: "100%", marginTop: 10 }}
                  />
                )}

                {user && (
                  <div style={{ marginTop: 10 }}>
                    <button onClick={() => startEdit(a)}>Editar</button>
                    <button onClick={() => remove(a.id)}>Eliminar</button>
                    <button onClick={() => sendToTelegram(a)}>Telegram</button>
                  </div>
                )}

              </div>
            ))}
        </div>
      ))}

      {/* 🔗 ENLACES */}
      <div style={{ marginTop: 40 }}>
        <h2>🔗 Enlaces de interés</h2>

        <a href="https://www.cervantesvirtual.com/" target="_blank">
          Biblioteca Cervantes
        </a><br />

        <a href="https://www.rae.es/" target="_blank">
          RAE
        </a><br />

        <a href="https://www.bne.es/" target="_blank">
          Biblioteca Nacional
        </a><br />

        <a href="https://bghyn.com/" target="_blank">
          Genealogía
        </a><br />

        <a href="https://www.rah.es/" target="_blank">
          Real Academia de la Historia
        </a>

      </div>

    </div>
  );
}