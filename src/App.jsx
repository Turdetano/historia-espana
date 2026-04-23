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
  getDoc
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
// 🎨 ESTILOS (LOS TUYOS ORIGINALES)
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

  // 🆕 NUEVO (NO INTERFIERE)
  const [users, setUsers] = useState([]);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [editingId, setEditingId] = useState(null);

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
  // 📚 CARGA ARTÍCULOS (SIN TOCAR)
  // ==============================

  useEffect(() => {
    getDocs(collection(db, "articles")).then(s =>
      setArticles(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, []);

  // ==============================
  // 👤 CARGA USUARIOS (AISLADO)
  // ==============================

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const snap = await getDocs(collection(db, "roles"));

        const list = snap.docs.map(d => ({
          uid: d.id,
          role: d.data().role
        }));

        setUsers(list);
      } catch (err) {
        console.error("Error usuarios:", err);
      }
    };

    loadUsers();
  }, []);

  // ==============================
  // 🚀 PUBLICAR / EDITAR (SIN TOCAR)
  // ==============================

  const publish = async () => {
    if (!user) return alert("Debes iniciar sesión");

    if (!title || !content) {
      alert("Rellena título y contenido");
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
    setTitle(a.title);
    setContent(a.content);
    setCategory(a.category);
    setEditingId(a.id);
  };

  const remove = async (a) => {
    if (!confirm("¿Eliminar este artículo?")) return;

    await deleteDoc(doc(db, "articles", a.id));

    const snapshot = await getDocs(collection(db, "articles"));
    setArticles(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  };

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
  // 🎨 UI (INTACTA)
  // ==============================

  return (
    <div style={{
      background: "#f1f5f9",
      minHeight: "100vh",
      padding: 20
    }}>

      <h1 style={{
        textAlign: "center",
        fontSize: "36px",
        fontWeight: "900",
        color: "#000"
      }}>
        📜 Historia de España
      </h1>

      {!user ? (
        <button onClick={login} style={btnPrimary}>
          Iniciar sesión
        </button>
      ) : (
        <div>
          <p>{user.email}</p>
          <button onClick={logout} style={btnDanger}>
            Cerrar sesión
          </button>
        </div>
      )}

      {user && (
        <div style={{
          background: "#fff",
          padding: 20,
          borderRadius: 10,
          maxWidth: 600,
          margin: "30px auto"
        }}>
          <h2>✍️ Crear artículo</h2>

          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título" />
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Contenido" />

          <select value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>

          <button onClick={publish} style={btnPrimary}>
            {editingId ? "Guardar cambios" : "Publicar"}
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
              <p>{a.content}</p>

              {user && (
                <>
                  <button onClick={() => startEdit(a)} style={btnPrimary}>Editar</button>
                  <button onClick={() => remove(a)} style={btnDanger}>Eliminar</button>
                  <button onClick={() => sendToTelegram(a)} style={btnPrimary}>Telegram</button>
                </>
              )}
            </div>
          ))}
        </div>
      ))}

      {/* 🔗 ENLACES DE INTERÉS */}
      <div style={{ marginTop: 40 }}>
        <h2 style={{
          fontWeight: "900",
          fontSize: "26px",
          color: "#020617"
        }}>
          🔗 Enlaces de interés
        </h2>

        <p><a href="https://es.hispanopedia.com/wiki/Inicio" target="_blank">Hispanopedia</a></p>
        <p><a href="https://www.cervantesvirtual.com/" target="_blank">Biblioteca Cervantes</a></p>
        <p><a href="https://www.rae.es/" target="_blank">RAE</a></p>
        <p><a href="https://www.bne.es/" target="_blank">BNE</a></p>
        <p><a href="https://bghyn.com/" target="_blank">Genealogía</a></p>
        <p><a href="https://www.rah.es/" target="_blank">RAH</a></p>
      </div>

      {/* 👤 PANEL USUARIOS (SEGURO) */}
      {user && role === "owner" && (
        <div style={{
          background: "#fff",
          padding: 20,
          marginTop: 40,
          borderRadius: 10
        }}>
          <h2>👤 Usuarios del sistema</h2>

          {users.map(u => (
            <div key={u.uid}>
              <p><strong>UID:</strong> {u.uid}</p>
              <p><strong>Rol:</strong> {u.role}</p>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}