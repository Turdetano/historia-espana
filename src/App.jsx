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
  // 🔐 AUTH
  // ==============================

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (u) {
        const ref = doc(db, "roles", u.uid);
        const snap = await getDoc(ref);

        if (u.uid === ADMIN_UID) setRole("owner");
        else if (snap.exists()) setRole(snap.data().role);
        else setRole("editor");
      } else {
        setRole(null);
      }
    });

    return () => unsub();
  }, []);

  const login = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);

  // ==============================
  // 👑 ROLES
  // ==============================

  const makeAdmin = async () => {
    const uid = prompt("UID admin:");
    if (!uid) return;
    await setDoc(doc(db, "roles", uid), { role: "admin" });
    loadUsers();
  };

  const makeEditor = async () => {
    const uid = prompt("UID editor:");
    if (!uid) return;
    await setDoc(doc(db, "roles", uid), { role: "editor" });
    loadUsers();
  };

  const deleteUserRole = async (uid) => {
    if (!confirm("¿Eliminar usuario?")) return;
    await deleteDoc(doc(db, "roles", uid));
    loadUsers();
  };

  const toggleRole = async (uid, role) => {
    const newRole = role === "admin" ? "editor" : "admin";
    await setDoc(doc(db, "roles", uid), { role: newRole });
    loadUsers();
  };

  const loadUsers = async () => {
    const snap = await getDocs(collection(db, "roles"));
    setUsers(snap.docs.map(d => ({ uid: d.id, role: d.data().role })));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // ==============================
  // 📚 ARTÍCULOS
  // ==============================

  const loadArticles = async () => {
    const snap = await getDocs(collection(db, "articles"));
    setArticles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    loadArticles();
  }, []);

  // ==============================
  // 🚀 PUBLICAR / EDITAR
  // ==============================

  const publish = async () => {
    if (!user) return alert("Debes iniciar sesión");

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
        author: user.email,
        uid: user.uid
      });
    }

    setTitle("");
    setContent("");
    setEditingId(null);
    loadArticles();
  };

  const startEdit = (a) => {
    setTitle(a.title);
    setContent(a.content);
    setCategory(a.category);
    setEditingId(a.id);
    setView("home");
  };

  const remove = async (id) => {
    if (!confirm("¿Eliminar artículo?")) return;
    await deleteDoc(doc(db, "articles", id));
    loadArticles();
  };

  const sendToTelegram = async (a) => {
    if (!confirm("¿Enviar a Telegram?")) return;

    await fetch("/api/telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(a)
    });

    alert("Enviado a Telegram");
  };

  // ==============================
  // 🎨 UI
  // ==============================

  return (
    <div style={{ background: "#f1f5f9", minHeight: "100vh", padding: 20 }}>

      <h1 style={{ textAlign: "center" }}>📜 Historia de España</h1>

      {/* NAV */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <button onClick={() => setView("home")} style={btnPrimary}>🏠 Inicio</button>
        <button onClick={() => setView("articles")} style={btnPrimary}>📚 Artículos</button>
        <button onClick={() => setView("links")} style={btnPrimary}>🔗 Enlaces</button>
      </div>

      {/* HOME */}
      {view === "home" && (
        <>
          {!user ? (
            <button onClick={login} style={btnPrimary}>Iniciar sesión</button>
          ) : (
            <div style={{ textAlign: "center" }}>
              <p>👤 {user.email}</p>
              <p>🔑 {role}</p>

              <button onClick={logout} style={btnDanger}>Cerrar sesión</button>

              {role === "owner" && (
                <div style={{ marginTop: 20 }}>
                  <button onClick={makeAdmin} style={btnPrimary}>➕ Admin</button>
                  <button onClick={makeEditor} style={btnPrimary}>➕ Editor</button>

                  <h3>Usuarios</h3>

                  {users.map(u => (
                    <div key={u.uid}>
                      <p>{u.uid} - {u.role}</p>
                      <button onClick={() => toggleRole(u.uid, u.role)} style={btnPrimary}>
                        Cambiar rol
                      </button>
                      <button onClick={() => deleteUserRole(u.uid)} style={btnDanger}>
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ARTICLES */}
      {view === "articles" && (
        <>
          {CATEGORIES.map(cat => (
            <div key={cat}>
              <h2>📚 {cat}</h2>

              {articles.filter(a => a.category === cat).map(a => (
                <div key={a.id} style={{ background: "#fff", padding: 10, margin: 10 }}>
                  <h3>{a.title}</h3>
                  <p>{a.content}</p>

                  {user && (
                    <>
                      <button onClick={() => startEdit(a)} style={btnPrimary}>Editar</button>
                      <button onClick={() => remove(a.id)} style={btnDanger}>Eliminar</button>
                      <button onClick={() => sendToTelegram(a)} style={btnPrimary}>Telegram</button>
                    </>
                  )}
                </div>
              ))}
            </div>
          ))}
        </>
      )}

      {/* LINKS */}
      {view === "links" && (
  <div style={{ maxWidth: 800, margin: "0 auto" }}>

    <h2 style={{
      background: "#e2e8f0",
      padding: "12px",
      borderRadius: "10px",
      fontWeight: "900",
      textAlign: "center"
    }}>
      🔗 Enlaces de interés
          {/* 🔗 ENLACES */}
      {view === "links" && (
        <div>
          <h2>🔗 Enlaces de interés</h2>

          {[
            { name: "Hispanopedia", url: "https://es.hispanopedia.com/wiki/Inicio" },
            { name: "Cervantes", url: "https://www.cervantesvirtual.com/" },
            { name: "RAE", url: "https://www.rae.es/" },
            { name: "BNE", url: "https://www.bne.es/" },
            { name: "Genealogía", url: "https://bghyn.com/" },
            { name: "Real Academia de la Historia", url: "https://www.rah.es/" }
          ].map(l => (
            <p key={l.name}>
              <a href={l.url} target="_blank" rel="noreferrer">
                {l.name}
              </a>
            </p>
          ))}
        </div>
      )}

    </div>
  );
}