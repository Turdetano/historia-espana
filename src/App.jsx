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
// ⚙️ CONFIGURACIÓN GENERAL
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

  // ==============================
  // 🔒 SEGURIDAD
  // ==============================

  const checkAuth = () => {
    if (!user) {
      alert("🔒 Debes iniciar sesión");
      return false;
    }
    return true;
  };

  // 🔥 NUEVO: PERMISOS
  const canEdit = (article) => {
    if (!user) return false;

    if (role === "owner" || role === "admin") return true;

    if (role === "editor" && article.uid === user.uid) return true;

    return false;
  };

  // ==============================
  // 🔐 AUTENTICACIÓN + ROLES
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
  // 👑 CREAR ROLES
  // ==============================

  const makeAdmin = async () => {
    const uid = prompt("UID del nuevo ADMIN:");
    if (!uid) return;

    await setDoc(doc(db, "roles", uid), { role: "admin" });
    alert("✅ Administrador añadido");
  };

  const makeEditor = async () => {
    const uid = prompt("UID del nuevo EDITOR:");
    if (!uid) return;

    await setDoc(doc(db, "roles", uid), { role: "editor" });
    alert("✅ Editor añadido");
  };

  // ==============================
  // ❌ ELIMINAR USUARIO
  // ==============================

  const deleteUserRole = async (uid) => {
    if (uid === ADMIN_UID) {
      alert("❌ No puedes eliminar al OWNER");
      return;
    }

    if (!confirm("¿Eliminar este usuario?")) return;

    await deleteDoc(doc(db, "roles", uid));

    const snap = await getDocs(collection(db, "roles"));
    setUsers(snap.docs.map(d => ({
      uid: d.id,
      role: d.data().role
    })));
  };

  const toggleRole = async (uid, currentRole) => {
    if (uid === ADMIN_UID) {
      alert("❌ No puedes modificar al OWNER");
      return;
    }

    const newRole = currentRole === "admin" ? "editor" : "admin";

    await setDoc(doc(db, "roles", uid), { role: newRole });

    const snap = await getDocs(collection(db, "roles"));
    setUsers(snap.docs.map(d => ({
      uid: d.id,
      role: d.data().role
    })));
  };

  useEffect(() => {
    const loadUsers = async () => {
      const snap = await getDocs(collection(db, "roles"));

      const list = snap.docs.map(d => ({
        uid: d.id,
        role: d.data().role
      }));

      setUsers(list);
    };

    loadUsers();
  }, []);

  // ==============================
  // 📚 ARTÍCULOS
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

    setTitle("");
    setContent("");
    setEditingId(null);
  };

  const startEdit = (a) => {
    if (!checkAuth()) return;

    if (!canEdit(a)) {
      alert("❌ No puedes editar este artículo");
      return;
    }

    setTitle(a.title);
    setContent(a.content);
    setCategory(a.category);
    setEditingId(a.id);
  };

  const remove = async (id) => {
    if (!checkAuth()) return;

    const article = articles.find(a => a.id === id);
    if (!canEdit(article)) {
      alert("❌ No tienes permiso");
      return;
    }

    if (!confirm("¿Eliminar este artículo?")) return;

    await deleteDoc(doc(db, "articles", id));

    const snapshot = await getDocs(collection(db, "articles"));
    setArticles(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  };

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
  // 🎨 UI
  // ==============================

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
        <div style={{ textAlign: "center" }}>
          <button onClick={login} style={btnPrimary}>
            Iniciar sesión
          </button>
        </div>
      ) : (
        <div style={{ textAlign: "center" }}>
          <p>👤 {user.email}</p>
          <p>🔑 Rol: {role}</p>
          <p style={{ fontSize: 12 }}>UID: {user.uid}</p>

          <button onClick={logout} style={btnDanger}>
            Cerrar sesión
          </button>

          {role === "owner" && (
            <div style={{ marginTop: 10 }}>
              <button onClick={makeAdmin} style={btnPrimary}>➕ Admin</button>
              <button onClick={makeEditor} style={btnPrimary}>➕ Editor</button>
            </div>
          )}
        </div>
      )}

      {/* 👤 USUARIOS */}
      {user && role === "owner" && (
        <div style={{
          background: "#fff",
          padding: 20,
          marginTop: 20,
          borderRadius: 10
        }}>
          <h2 style={{
            color: "#020617",
            background: "#e2e8f0",
            padding: "10px",
            borderRadius: "8px",
            display: "inline-block",
            fontWeight: "900"
          }}>
            👤 Usuarios del sistema
          </h2>

          {users.map(u => (
            <div key={u.uid} style={{
              marginBottom: 10,
              padding: 10,
              background: "#f8fafc",
              borderRadius: 8
            }}>
              <p><strong>UID:</strong> {u.uid}</p>
              <p><strong>Rol:</strong> {u.role}</p>

              <button onClick={() => toggleRole(u.uid, u.role)} style={btnPrimary}>
                🔄 Cambiar rol
              </button>

              <button onClick={() => deleteUserRole(u.uid)} style={btnDanger}>
                ❌ Eliminar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ✍️ FORMULARIO */}
      {user && (
        <div style={{
          background: "#ffffff",
          padding: 25,
          borderRadius: 12,
          maxWidth: 600,
          margin: "30px auto",
          boxShadow: "0 6px 18px rgba(0,0,0,0.2)"
        }}>
          <h2 style={{
            color: "#020617",
            background: "#e2e8f0",
            padding: "10px",
            borderRadius: "8px",
            display: "inline-block",
            fontWeight: "900"
          }}>
            ✍️ Crear artículo
          </h2>

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

      {/* 📚 ARTÍCULOS */}
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
              <p>{a.content}</p>

              {a.image && (
                <img src={a.image} style={{ maxWidth: "100%", marginTop: 10 }} />
              )}

              {user && canEdit(a) && (
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

    </div>
  );
}