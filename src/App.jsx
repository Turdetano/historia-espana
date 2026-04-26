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
          const snap = await getDoc(doc(db, "roles", u.uid));

          if (u.uid === ADMIN_UID) setRole("owner");
          else if (snap.exists()) setRole(snap.data().role);
          else setRole("editor");

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
  // 👑 ROLES
  // ==============================

  const makeAdmin = async () => {
    const uid = prompt("UID ADMIN:");
    if (!uid) return;
    await setDoc(doc(db, "roles", uid), { role: "admin" });
    loadUsers();
  };

  const makeEditor = async () => {
    const uid = prompt("UID EDITOR:");
    if (!uid) return;
    await setDoc(doc(db, "roles", uid), { role: "editor" });
    loadUsers();
  };

  const deleteUserRole = async (uid) => {
    if (uid === ADMIN_UID) return alert("No puedes borrar OWNER");
    if (!confirm("¿Eliminar usuario?")) return;

    await deleteDoc(doc(db, "roles", uid));
    loadUsers();
  };

  const toggleRole = async (uid, current) => {
    if (uid === ADMIN_UID) return;

    const newRole = current === "admin" ? "editor" : "admin";
    await setDoc(doc(db, "roles", uid), { role: newRole });

    loadUsers();
  };

  const loadUsers = async () => {
    const snap = await getDocs(collection(db, "roles"));
    setUsers(snap.docs.map(d => ({
      uid: d.id,
      role: d.data().role
    })));
  };

  useEffect(() => { loadUsers(); }, []);

  // ==============================
  // 📚 ARTÍCULOS
  // ==============================

  const loadArticles = async () => {
    const snap = await getDocs(collection(db, "articles"));
    setArticles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => { loadArticles(); }, []);

  // ==============================
  // 🚀 PUBLICAR / EDITAR
  // ==============================

  const publish = async () => {
    if (!checkAuth()) return;

    if (!title || !content) return alert("Faltan datos");

    if (editingId) {
      const article = articles.find(a => a.id === editingId);
      if (!canEditOrDelete(article)) return alert("Sin permiso");

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

    loadArticles();
    setTitle("");
    setContent("");
    setEditingId(null);
  };

  const startEdit = (a) => {
    if (!canEditOrDelete(a)) return alert("Sin permiso");

    setTitle(a.title);
    setContent(a.content);
    setCategory(a.category);
    setEditingId(a.id);
  };

  const remove = async (id) => {
    const article = articles.find(a => a.id === id);
    if (!canEditOrDelete(article)) return;

    if (!confirm("¿Eliminar?")) return;

    await deleteDoc(doc(db, "articles", id));
    loadArticles();
  };

  const sendToTelegram = async (a) => {
    if (!(role === "admin" || role === "owner")) {
      return alert("Solo admin");
    }

    if (!confirm("¿Enviar a Telegram?")) return;

    await fetch("/api/telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(a)
    });

    alert("Enviado");
  };

  // ==============================
  // 🎨 UI
  // ==============================

  return (
    <div style={{ background: "#f1f5f9", padding: 20 }}>

      <h1 style={{ textAlign: "center", fontSize: 36 }}>
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
          <p>{user.email}</p>
          <p>Rol: {role}</p>

          <button onClick={logout} style={btnDanger}>
            Cerrar sesión
          </button>

          {role === "owner" && (
            <>
              <button onClick={makeAdmin}>Admin</button>
              <button onClick={makeEditor}>Editor</button>
            </>
          )}
        </div>
      )}

      {/* USUARIOS */}
      {role === "owner" && (
        <div style={{ background: "#fff", padding: 20 }}>
          <h2>👤 Usuarios</h2>

          {users.map(u => (
            <div key={u.uid}>
              {u.uid} - {u.role}
              <button onClick={() => toggleRole(u.uid, u.role)}>Cambiar</button>
              <button onClick={() => deleteUserRole(u.uid)}>Eliminar</button>
            </div>
          ))}
        </div>
      )}

      {/* FORMULARIO */}
      {user && (
        <div style={{ background: "#fff", padding: 20 }}>
          <h2>✍️ Crear artículo</h2>

          <input value={title} onChange={e => setTitle(e.target.value)} />
          <textarea value={content} onChange={e => setContent(e.target.value)} />

          <select onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>

          <button onClick={publish}>
            {editingId ? "Guardar" : "Publicar"}
          </button>
        </div>
      )}

      {/* ARTÍCULOS */}
      {CATEGORIES.map(cat => (
        <div key={cat}>
          <h2>📚 {cat}</h2>

          {articles.filter(a => a.category === cat).map(a => (
            <div key={a.id} style={{ background: "#fff", margin: 10, padding: 10 }}>
              <h3>{a.title}</h3>
              <p>{a.content}</p>

              {a.image && <img src={a.image} style={{ maxWidth: "100%" }} />}

              {user && (
                <>
                  <button onClick={() => startEdit(a)}>Editar</button>
                  <button onClick={() => remove(a.id)}>Eliminar</button>
                  <button onClick={() => sendToTelegram(a)}>Telegram</button>
                </>
              )}
            </div>
          ))}
        </div>
      ))}

      {/* ENLACES */}
      <div style={{ marginTop: 40 }}>
        <h2 style={{ fontWeight: "900" }}>🔗 Enlaces de interés</h2>

        {[
          { name: "Hispanopedia", url: "https://es.hispanopedia.com/wiki/Inicio" },
          { name: "Biblioteca Cervantes", url: "https://www.cervantesvirtual.com/" },
          { name: "RAE", url: "https://www.rae.es/" },
          { name: "Biblioteca Nacional", url: "https://www.bne.es/" },
          { name: "Genealogía", url: "https://bghyn.com/" },
          { name: "Real Academia Historia", url: "https://www.rah.es/" }
        ].map(link => (
          <p key={link.name}>
            <a href={link.url} target="_blank">{link.name}</a>
          </p>
        ))}
      </div>

    </div>
  );
}