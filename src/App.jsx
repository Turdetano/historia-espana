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
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
  marginRight: 10,
  fontWeight: "bold"
};

const btnDanger = {
  background: "#b91c1c",
  color: "#fff",
  padding: "10px 16px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
  fontWeight: "bold"
};

// ==============================
// 🚀 APP
// ==============================

export default function App() {

  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [articles, setArticles] = useState([]);
  const [users, setUsers] = useState([]);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [editingId, setEditingId] = useState(null);

  const [view, setView] = useState("home");

  // ==============================
  // AUTH
  // ==============================

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
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
  }, []);

  const login = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);

  // ==============================
  // ROLES
  // ==============================

  const makeRole = async (roleType) => {
    const uid = prompt("UID:");
    if (!uid) return;
    await setDoc(doc(db, "roles", uid), { role: roleType });
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
  // ARTICLES
  // ==============================

  const loadArticles = async () => {
    const snap = await getDocs(collection(db, "articles"));
    setArticles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const publish = async () => {
    if (!user) return;

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
    if (!confirm("¿Eliminar?")) return;
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

    alert("Enviado");
  };

  // ==============================
  // UI
  // ==============================

  return (
    <div style={{ padding: 20, background: "#f1f5f9", minHeight: "100vh" }}>

      <h1 style={{ textAlign: "center" }}>
        📜 Historia de España
      </h1>

      {/* NAV */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <button onClick={() => setView("home")} style={btnPrimary}>Inicio</button>
        <button onClick={() => setView("articles")} style={btnPrimary}>Artículos</button>
        <button onClick={() => setView("links")} style={btnPrimary}>Enlaces</button>
      </div>

      {/* HOME */}
      {view === "home" && (
        <div style={{ textAlign: "center" }}>
          {!user ? (
            <button onClick={login} style={btnPrimary}>Login</button>
          ) : (
            <>
              <p>👤 {user.email}</p>
              <p>🔑 {role}</p>
              <button onClick={logout} style={btnDanger}>Logout</button>

              {role === "owner" && (
                <div style={{ marginTop: 20 }}>
                  <button onClick={() => makeRole("admin")} style={btnPrimary}>Admin</button>
                  <button onClick={() => makeRole("editor")} style={btnPrimary}>Editor</button>

                  <h3>Usuarios</h3>

                  {users.map(u => (
                    <p key={u.uid}>{u.uid} - {u.role}</p>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ARTICLES */}
      {view === "articles" && (
        <div>
          {CATEGORIES.map(cat => (
            <div key={cat}>
              <h2>{cat}</h2>

              {articles.filter(a => a.category === cat).map(a => (
                <div key={a.id} style={{ background: "#fff", padding: 10, margin: 10 }}>
                  <h3>{a.title}</h3>
                  <p>{a.content}</p>

                  <button onClick={() => startEdit(a)} style={btnPrimary}>Editar</button>
                  <button onClick={() => remove(a.id)} style={btnDanger}>Eliminar</button>
                  <button onClick={() => sendToTelegram(a)} style={btnPrimary}>Telegram</button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* LINKS */}
      {view === "links" && (
        <div>
          <h2>🔗 Enlaces de interés</h2>

          {[
            ["RAH", "https://www.rah.es/"],
            ["RAE", "https://www.rae.es/"],
            ["Cervantes", "https://www.cervantesvirtual.com/"],
            ["BNE", "https://www.bne.es/"],
            ["Genealogía", "https://bghyn.com/"]
          ].map(l => (
            <p key={l[0]}>
              <a href={l[1]} target="_blank" rel="noreferrer">
                {l[0]}
              </a>
            </p>
          ))}
        </div>
      )}

    </div>
  );
}