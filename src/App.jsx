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

  const [view, setView] = useState("home");

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

  // ==============================
  // 🔐 PERMISOS
  // ==============================

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
  // 👤 USUARIOS
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

  const deleteUserRole = async (uid) => {
    if (uid === ADMIN_UID) return alert("❌ No puedes eliminar al OWNER");
    if (!confirm("¿Eliminar este usuario?")) return;

    await deleteDoc(doc(db, "roles", uid));
    const snap = await getDocs(collection(db, "roles"));
    setUsers(snap.docs.map(d => ({ uid: d.id, role: d.data().role })));
  };

  const toggleRole = async (uid, currentRole) => {
    if (uid === ADMIN_UID) return alert("❌ No puedes modificar al OWNER");

    const newRole = currentRole === "admin" ? "editor" : "admin";
    await setDoc(doc(db, "roles", uid), { role: newRole });

    const snap = await getDocs(collection(db, "roles"));
    setUsers(snap.docs.map(d => ({ uid: d.id, role: d.data().role })));
  };

  useEffect(() => {
    getDocs(collection(db, "roles")).then(s =>
      setUsers(s.docs.map(d => ({ uid: d.id, role: d.data().role })))
    );
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
      const article = articles.find(a => a.id === editingId);

      if (!canEditOrDelete(article)) {
        alert("❌ No tienes permiso");
        return;
      }

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
    if (!canEditOrDelete(a)) return alert("❌ No tienes permiso");

    setTitle(a.title);
    setContent(a.content);
    setCategory(a.category);
    setEditingId(a.id);
  };

  const remove = async (id) => {
    if (!checkAuth()) return;

    const article = articles.find(a => a.id === id);
    if (!canEditOrDelete(article)) return alert("❌ No tienes permiso");

    if (!confirm("¿Eliminar este artículo?")) return;

    await deleteDoc(doc(db, "articles", id));

    const snapshot = await getDocs(collection(db, "articles"));
    setArticles(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const sendToTelegram = async (a) => {
    if (!checkAuth()) return;
    if (!(role === "admin" || role === "owner")) return alert("❌ Solo admin");

    if (!confirm("¿Enviar a Telegram?")) return;

    await fetch("/api/telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(a)
    });

    alert("✅ Enviado");
  };

  // ==============================
  // 🎨 UI
  // ==============================

  return (
    <div style={{ background: "#f1f5f9", minHeight: "100vh", padding: 20 }}>

      <h1 style={{ textAlign: "center", fontSize: "36px" }}>
        📜 Historia de España
      </h1>

      {/* 🧭 MENÚ */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <button onClick={() => setView("home")} style={btnPrimary}>🏠 Inicio</button>
        <button onClick={() => setView("articles")} style={btnPrimary}>📚 Artículos</button>
        <button onClick={() => setView("links")} style={btnPrimary}>🔗 Enlaces</button>
        {role === "owner" && (
          <button onClick={() => setView("admin")} style={btnPrimary}>⚙️ Admin</button>
        )}
      </div>

      {/* 🔗 ENLACES COMPLETOS RESTAURADOS */}
      {view === "links" && (
        <div>
          <h2>🔗 Enlaces de interés</h2>

          {[
            { name: "Hispanopedia", url: "https://es.hispanopedia.com/wiki/Inicio" },
            { name: "Biblioteca Cervantes", url: "https://www.cervantesvirtual.com/" },
            { name: "Real Academia Española", url: "https://www.rae.es/" },
            { name: "Biblioteca Nacional de España", url: "https://www.bne.es/" },
            { name: "Genealogía", url: "https://bghyn.com/" },
            { name: "Real Academia de la Historia", url: "https://www.rah.es/" }
          ].map(link => (
            <p key={link.name}>
              <a href={link.url} target="_blank">{link.name}</a>
            </p>
          ))}
        </div>
      )}

    </div>
  );
}