// ==============================
// 📦 IMPORTACIONES
// ==============================

import { db, auth } from "./firebase.js";
import {
  collection, addDoc, getDocs, deleteDoc, doc, updateDoc, getDoc, setDoc
} from "firebase/firestore";
import {
  signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged
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
// 🎨 ESTILOS RESPONSIVE
// ==============================

const btnPrimary = {
  background: "#1d4ed8", color: "#fff", padding: "14px 20px", borderRadius: 10,
  border: "none", cursor: "pointer", marginRight: 10, fontWeight: "bold",
  fontSize: "16px", minHeight: "48px", touchAction: "manipulation"
};

const btnDanger = {
  background: "#b91c1c", color: "#fff", padding: "14px 20px", borderRadius: 10,
  border: "none", cursor: "pointer", fontWeight: "bold",
  fontSize: "16px", minHeight: "48px", touchAction: "manipulation"
};

const btnSecondary = {
  background: "#475569", color: "#fff", padding: "14px 20px", borderRadius: 10,
  border: "none", cursor: "pointer", marginRight: 10, fontWeight: "bold",
  fontSize: "16px", minHeight: "48px", touchAction: "manipulation"
};

// Estilos responsive con media queries
const styles = `
  * {
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent;
  }
  
  button {
    transition: transform 0.1s, opacity 0.2s;
  }
  
  button:active {
    transform: scale(0.98);
    opacity: 0.9;
  }

  /* MÓVIL (hasta 640px) */
  @media (max-width: 640px) {
    .nav-buttons {
      display: flex;
      flex-direction: column;
      gap: 10px;
      align-items: stretch;
    }
    
    .nav-buttons button {
      width: 100%;
      margin: 0;
      padding: 16px 20px;
      font-size: 16px;
    }
    
    .article-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .article-actions button {
      width: 100%;
      margin: 0;
      padding: 14px 16px;
    }
    
    .user-info-section {
      padding: 15px !important;
    }
    
    .user-uid-box {
      flex-direction: column !important;
      gap: 8px !important;
    }
    
    .user-uid-box code {
      word-break: break-all;
      font-size: 12px;
    }
    
    .admin-buttons {
      flex-direction: column !important;
      gap: 8px !important;
    }
    
    .admin-buttons button {
      width: 100% !important;
      margin: 0 !important;
    }
    
    .user-card {
      flex-direction: column !important;
      align-items: stretch !important;
      gap: 12px !important;
    }
    
    .user-card-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .user-card-actions button {
      width: 100%;
    }
    
    h1 {
      font-size: 28px !important;
    }
    
    h2 {
      font-size: 22px !important;
    }
    
    .imperial-title {
      font-size: 36px !important;
    }
    
    .form-input, .form-textarea, .form-select {
      font-size: 16px !important; /* Previene zoom en iOS */
    }
  }

  /* TABLET (641px - 1024px) */
  @media (min-width: 641px) and (max-width: 1024px) {
    .nav-buttons {
      flex-wrap: wrap;
      justify-content: center;
      gap: 10px;
    }
    
    .nav-buttons button {
      flex: 1 1 auto;
      min-width: 120px;
    }
    
    .article-actions {
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .article-actions button {
      flex: 1 1 auto;
      min-width: 100px;
    }
    
    .user-card {
      flex-wrap: wrap;
    }
    
    .admin-buttons {
      flex-wrap: wrap;
    }
  }

  /* DESKTOP (más de 1024px) */
  @media (min-width: 1025px) {
    .nav-buttons {
      display: flex;
      flex-direction: row;
      justify-content: center;
      gap: 0;
    }
    
    .nav-buttons button {
      margin-right: 10px;
    }
  }

  /* MEJORAS TÁCTILES GENERALES */
  @media (hover: none) {
    button {
      padding: 16px 20px;
    }
    
    .article-actions button {
      padding: 14px 16px;
    }
  }
`;

// ==============================
// 🚀 APP
// ==============================

export default function App() {
  // Estados principales
  const [articles, setArticles] = useState([]);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [users, setUsers] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  
  // Estados para artículos
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [editingId, setEditingId] = useState(null);
  
  // Estados para navegación y enlaces
  const [view, setView] = useState("home");
  const [links, setLinks] = useState([]);
  const [newLinkName, setNewLinkName] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  
  // Estado para feedback de copiar UID
  const [copiedUid, setCopiedUid] = useState(false);

  // ==============================
  // 📝 REGISTRO DE ACTIVIDAD
  // ==============================
  const logActivity = async (type, details = "") => {
    try {
      const logRef = await addDoc(collection(db, "activity_log"), {
        type,
        details,
        userEmail: user?.email || "Sistema",
        userId: user?.uid || "Sistema",
        timestamp: new Date().toISOString()
      });
      console.log("✅ Log registrado:", logRef.id);
    } catch (err) {
      console.error("❌ Error al registrar:", err);
    }
  };

  useEffect(() => {
    const loadLogs = async () => {
      if (role !== "owner" && role !== "admin") return;
      try {
        const snap = await getDocs(collection(db, "activity_log"));
        const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setActivityLogs(logs.slice(0, 50));
      } catch (err) {
        console.error("Error cargando logs:", err);
      }
    };
    loadLogs();
  }, [role]);

  // ==============================
  // 🔒 SEGURIDAD
  // ==============================
  const checkAuth = () => {
    if (!user) { alert("🔒 Debes iniciar sesión"); return false; }
    return true;
  };

  // ==============================
  // 🔐 AUTENTICACIÓN + ROLES
  // ==============================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          let userRole = null;
          const uidRef = doc(db, "roles", u.uid);
          const uidSnap = await getDoc(uidRef);
          if (uidSnap.exists()) {
            userRole = uidSnap.data().role;
          } else if (u.email) {
            const emailRef = doc(db, "roles", u.email);
            const emailSnap = await getDoc(emailRef);
            if (emailSnap.exists()) {
              userRole = emailSnap.data().role;
              await setDoc(uidRef, { role: userRole, email: u.email, migratedAt: new Date().toISOString() });
              await deleteDoc(emailRef);
            }
          }
          if (!userRole) {
            await setDoc(uidRef, { role: "lector", email: u.email, createdAt: new Date().toISOString() });
            userRole = "lector";
            logActivity("nuevo_registro", `Usuario registrado: ${u.email}`);
            alert("👋 Bienvenido. Cuenta creada como LECTOR.");
          }
          setRole(userRole);
        } catch (err) {
          console.error("Error auth:", err);
          setRole("lector");
        }
      } else {
        setRole(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // ==============================
  // 👤 CARGAR USUARIOS
  // ==============================
  useEffect(() => {
    const loadUsers = async () => {
      const snap = await getDocs(collection(db, "roles"));
      setUsers(snap.docs.map(d => ({ uid: d.id, role: d.data().role, email: d.data().email || "Sin email" })));
    };
    loadUsers();
  }, []);

  // ==============================
  // 📚 CARGAR ARTÍCULOS
  // ==============================
  useEffect(() => {
    const loadArticles = async () => {
      const snap = await getDocs(collection(db, "articles"));
      setArticles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    loadArticles();
  }, []);

  // ==============================
  // 🔗 CARGAR ENLACES
  // ==============================
  useEffect(() => {
    const loadLinks = async () => {
      const snap = await getDocs(collection(db, "links"));
      setLinks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    loadLinks();
  }, []);

  // ==============================
  // 🔐 AUTH
  // ==============================
  const login = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);

  // ==============================
  // 📋 COPIAR UID
  // ==============================
  const copyUidToClipboard = () => {
    if (user?.uid) {
      navigator.clipboard.writeText(user.uid);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
      alert("✅ UID copiado: " + user.uid);
    }
  };

  // ==============================
  // 👑 ROLES
  // ==============================
  const makeAdmin = async () => {
    if (role !== "owner") return alert("❌ Solo el OWNER puede asignar admins");
    const target = prompt("UID o Email del nuevo ADMIN:");
    if (!target) return;
    await setDoc(doc(db, "roles", target), { role: "admin", updatedAt: new Date().toISOString() });
    logActivity("rol_asignado", `${target} ascendido a ADMIN`);
    alert("✅ Admin asignado.");
    const snap = await getDocs(collection(db, "roles"));
    setUsers(snap.docs.map(d => ({ uid: d.id, role: d.data().role, email: d.data().email || d.id })));
  };

  const makeEditor = async () => {
    if (role !== "owner" && role !== "admin") return alert("❌ No tienes permisos");
    const target = prompt("UID o Email del nuevo EDITOR:");
    if (!target) return;
    await setDoc(doc(db, "roles", target), { role: "editor", updatedAt: new Date().toISOString() });
    logActivity("rol_asignado", `${target} ascendido a EDITOR`);
    alert("✅ Editor asignado.");
    const snap = await getDocs(collection(db, "roles"));
    setUsers(snap.docs.map(d => ({ uid: d.id, role: d.data().role, email: d.data().email || d.id })));
  };

  const deleteUserRole = async (uid) => {
    if (uid === ADMIN_UID) return alert("❌ No puedes eliminar al OWNER");
    if (!confirm("¿Eliminar usuario?")) return;
    await deleteDoc(doc(db, "roles", uid));
    logActivity("usuario_eliminado", `Usuario ${uid} eliminado`);
    const snap = await getDocs(collection(db, "roles"));
    setUsers(snap.docs.map(d => ({ uid: d.id, role: d.data().role, email: d.data().email || d.id })));
  };

  const toggleRole = async (uid, currentRole) => {
    if (uid === ADMIN_UID) return alert("❌ No puedes modificar al OWNER");
    const newRole = currentRole === "admin" ? "editor" : "admin";
    await setDoc(doc(db, "roles", uid), { role: newRole, updatedAt: new Date().toISOString() });
    logActivity("rol_cambiado", `Usuario ${uid} cambiado a ${newRole.toUpperCase()}`);
    const snap = await getDocs(collection(db, "roles"));
    setUsers(snap.docs.map(d => ({ uid: d.id, role: d.data().role, email: d.data().email || d.id })));
  };

  // ==============================
  // 🚀 ARTÍCULOS: CRUD
  // ==============================
  const publish = async () => {
    if (!checkAuth()) return;
    if (!title || !content) return alert("❌ Rellena título y contenido");
    
    const imageUrl = image || "";
    const actionType = editingId ? "articulo_actualizado" : "articulo_creado";
    
    if (editingId) {
      await updateDoc(doc(db, "articles", editingId), {
        title, content, category, image: imageUrl, updatedAt: new Date().toISOString()
      });
    } else {
      await addDoc(collection(db, "articles"), {
        title, content, category, image: imageUrl,
        date: new Date().toLocaleDateString(), author: user.email, authorId: user.uid,
        createdAt: new Date().toISOString()
      });
    }
    
    logActivity(actionType, `"${title}" por ${user.email}`);
    
    const snap = await getDocs(collection(db, "articles"));
    setArticles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setTitle(""); setContent(""); setImage(""); setEditingId(null);
  };

  const startEdit = (a) => {
    if (!checkAuth()) return;
    if (role === "editor" && a.authorId !== user.uid) return alert("❌ Solo puedes editar tus artículos");
    setTitle(a.title); setContent(a.content); setCategory(a.category);
    setImage(a.image || ""); setEditingId(a.id); setView("admin");
  };

  const removeArticle = async (id) => {
    if (!checkAuth()) return;
    const article = articles.find(a => a.id === id);
    if (role === "editor" && article?.authorId !== user.uid) return alert("❌ Solo puedes eliminar tus artículos");
    if (!confirm("¿Eliminar este artículo?")) return;
    await deleteDoc(doc(db, "articles", id));
    logActivity("articulo_eliminado", `"${article?.title}" eliminado por ${user.email}`);
    const snap = await getDocs(collection(db, "articles"));
    setArticles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  // 📤 TELEGRAM
  const sendToTelegram = async (a) => {
    if (!checkAuth()) return;
    const lastSend = localStorage.getItem(`tg_cooldown_${user.uid}`);
    if (lastSend && (Date.now() - parseInt(lastSend)) < 300000) {
      const waitSec = Math.ceil((300000 - (Date.now() - parseInt(lastSend))) / 1000);
      return alert(`⏳ Anti-Spam: Espera ${waitSec}s.`);
    }
    if (!confirm("¿Enviar a Telegram?")) return;

    const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
    const CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;
    if (!BOT_TOKEN || !CHAT_ID) return alert("⚠️ Credenciales de Telegram faltantes.");

    const safeTitle = a.title.replace(/[*_`~[\]\\]/g, "");
    const safeContent = a.content.replace(/[*_`~[\]\\]/g, "");
    const safeCategory = a.category.replace(/[*_`~[\]\\]/g, "");
    const header = `📜 *${safeTitle}*\n📚 ${safeCategory}\n\n`;
    
    const splitMessage = (text, maxSize = 4000) => {
      const chunks = [];
      for (let i = 0; i < text.length; i += maxSize) chunks.push(text.substring(i, i + maxSize));
      return chunks;
    };

    try {
      if (a.image) {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: CHAT_ID, photo: a.image, caption: header + "👇 *Artículo completo* 👇", parse_mode: "Markdown" })
        });
      }

      const fullContent = header + safeContent + `\n\n🔗 Ver en la web: ${window.location.origin}`;
      const chunks = splitMessage(fullContent);

      for (let i = 0; i < chunks.length; i++) {
        const suffix = i < chunks.length - 1 ? "\n\n*(continúa...)*" : "\n\n✅ *Fin*";
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: CHAT_ID, text: chunks[i] + suffix, parse_mode: "Markdown" })
        });
      }

      localStorage.setItem(`tg_cooldown_${user.uid}`, Date.now().toString());
      logActivity("telegram_enviado", `"${a.title}" enviado a Telegram`);
      alert("✅ Enviado a Telegram (Cooldown 5 min).");
    } catch (err) { alert("❌ Error: " + err.message); }
  };

  // ==============================
  // 🔗 ENLACES
  // ==============================
  const addLink = async () => {
    if (!newLinkName || !newLinkUrl) return alert("Rellena nombre y URL");
    await addDoc(collection(db, "links"), { name: newLinkName, url: newLinkUrl, createdAt: new Date().toISOString() });
    logActivity("enlace_creado", `"${newLinkName}" añadido`);
    setNewLinkName(""); setNewLinkUrl("");
    const snap = await getDocs(collection(db, "links"));
    setLinks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const removeLink = async (id) => {
    if (!confirm("¿Eliminar enlace?")) return;
    await deleteDoc(doc(db, "links", id));
    logActivity("enlace_eliminado", `Enlace ${id} eliminado`);
    const snap = await getDocs(collection(db, "links"));
    setLinks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  // ==============================
  // 🎨 UI
  // ==============================
  return (
    <div style={{ background: "#f1f5f9", minHeight: "100vh", padding: 20, fontFamily: "Segoe UI, Arial", color: "#111" }}>
      {/* ESTILOS RESPONSIVE */}
      <style>{styles}</style>
      
      <h1 style={{ textAlign: "center", fontSize: "36px", fontWeight: "900", color: "#020617", fontFamily: "Georgia, serif" }}>📜 Historia de España</h1>

      {/* NAVEGACIÓN RESPONSIVE */}
      <div className="nav-buttons" style={{ textAlign: "center", marginBottom: 20 }}>
        <button onClick={() => setView("home")} style={btnPrimary}>🏠 Inicio</button>
        <button onClick={() => setView("articles")} style={btnPrimary}>📚 Artículos</button>
        <button onClick={() => setView("links")} style={btnPrimary}>🔗 Enlaces</button>
        {(role === "owner" || role === "admin") && (
          <button onClick={() => setView("admin")} style={btnDanger}>⚙️ Administración</button>
        )}
      </div>

      {/* 🏠 INICIO */}
      {view === "home" && (
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <div style={{ marginBottom: 30, padding: 20 }}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/8/8b/Escudo_de_los_Reyes_Catolicos_%281475-1492%29.svg" alt="Escudo" style={{ width: "min(220px, 50vw)", height: "auto", objectFit: "contain", filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))" }} onError={(e) => { e.target.style.display = 'none'; }} />
          </div>
          <div style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #7c2d12 100%)", color: "#fbbf24", padding: "30px 20px", borderRadius: 15, marginBottom: 40, boxShadow: "0 8px 24px rgba(0,0,0,0.3)", border: "3px solid #fbbf24" }}>
            <h2 className="imperial-title" style={{ fontSize: "52px", fontWeight: "900", margin: 0, textShadow: "3px 3px 6px rgba(0,0,0,0.5)", letterSpacing: "4px", fontFamily: "Georgia, 'Times New Roman', serif", textTransform: "uppercase" }}>🏛️ HISPANIA IMPERIAL 🏛️</h2>
            <p style={{ fontSize: "22px", marginTop: 15, fontStyle: "italic", color: "#fef3c7", fontFamily: "Georgia, serif", letterSpacing: "2px" }}>PLUS ULTRA</p>
          </div>
          <div style={{ background: "#fff", padding: 40, borderRadius: 15, marginBottom: 40, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", border: "2px solid #e2e8f0" }}>
            <h3 style={{ fontSize: "24px", color: "#1e3a8a", marginBottom: 25, fontWeight: "700", borderBottom: "2px solid #fbbf24", paddingBottom: 10, fontFamily: "Georgia, serif" }}>📜 España - Jorge Doré</h3>
            <div style={{ fontSize: "16px", lineHeight: 2.2, color: "#334155", fontStyle: "italic", whiteSpace: "pre-line", fontFamily: "Georgia, serif" }}>
              <p style={{ margin: "15px 0", fontWeight: "600" }}>¡Qué triste España y qué amargo,<br />es ver como te debates<br />a vida o muerte entre turbas<br />de apóstatas y desleales!</p>
              <p style={{ margin: "15px 0", fontWeight: "600" }}>¡Qué lamentable cortejo<br />de alimañas insaciables<br />te timonea escorada...</p>
            </div>
          </div>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <button onClick={() => setView("articles")} style={{...btnPrimary, fontSize: "18px", padding: "15px 30px", background: "linear-gradient(135deg, #1e3a8a 0%, #7c2d12 100%)", boxShadow: "0 4px 12px rgba(0,0,0,0.2)", border: "2px solid #fbbf24" }}>📚 Explorar la Historia de España</button>
          </div>
          {!user && (
            <div style={{ textAlign: "center", marginTop: 40 }}>
              <p style={{ color: "#64748b", marginBottom: 15 }}>Para crear o editar artículos, inicia sesión</p>
              <button onClick={login} style={btnPrimary}>🔐 Iniciar sesión</button>
            </div>
          )}
        </div>
      )}

      {/* 📚 ARTÍCULOS */}
      {view === "articles" && (
        <>
          {CATEGORIES.map(cat => {
            const catArticles = articles.filter(a => a.category === cat);
            if (catArticles.length === 0) return null;
            return (
              <div key={cat} style={{ marginBottom: 30 }}>
                <h2 style={{ color: "#1d4ed8", borderBottom: "2px solid #e2e8f0", paddingBottom: 5, fontFamily: "Georgia, serif" }}>📚 {cat}</h2>
                {catArticles.map(a => (
                  <div key={a.id} style={{ background: "#fff", padding: 15, marginBottom: 15, borderRadius: 10 }}>
                    <h3 style={{ fontFamily: "Georgia, serif" }}>{a.title}</h3>
                    <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{a.content}</p>
                    {a.image && <img src={a.image} style={{ maxWidth: "100%", marginTop: 10, borderRadius: 8 }} alt={a.title} onError={(e) => { e.target.style.display = 'none'; }} />}
                    {user && ((role === "owner" || role === "admin" || (role === "editor" && a.authorId === user.uid))) && (
                      <div className="article-actions" style={{ marginTop: 10 }}>
                        <button onClick={() => startEdit(a)} style={btnPrimary}>✏️ Editar</button>
                        <button onClick={() => removeArticle(a.id)} style={btnDanger}>🗑️ Eliminar</button>
                        <button onClick={() => sendToTelegram(a)} style={{ ...btnPrimary, background: "#22c55e" }}>📤 Telegram</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
          {articles.length === 0 && <p style={{ textAlign: "center", color: "#64748b" }}>No hay artículos publicados aún.</p>}
        </>
      )}

      {/* 🔗 ENLACES */}
      {view === "links" && (
        <div style={{ marginTop: 40, maxWidth: 800, margin: "40px auto" }}>
          <h2 style={{ fontWeight: "900", fontSize: "26px", color: "#020617", background: "#e2e8f0", padding: "10px", borderRadius: "8px", display: "inline-block", fontFamily: "Georgia, serif" }}>🔗 Enlaces de interés</h2>
          <div style={{ marginTop: 20, display: "grid", gap: 15 }}>
            {links.length > 0 ? links.map(link => (
              <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" style={{ display: "block", padding: 15, background: "#fff", borderRadius: 10, fontWeight: "700", color: "#0f172a", textDecoration: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", fontFamily: "Georgia, serif" }}>🔗 {link.name}</a>
            )) : <p style={{ textAlign: "center", color: "#64748b" }}>No hay enlaces disponibles.</p>}
          </div>
        </div>
      )}

      {/* ⚙️ ADMINISTRACIÓN */}
      {view === "admin" && (role === "owner" || role === "admin") && (
        <div style={{ maxWidth: 900, margin: "30px auto" }}>
          <div className="user-info-section" style={{ textAlign: "center", background: "#fff", padding: 15, borderRadius: 10, marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <p style={{ margin: "5px 0", fontWeight: 500 }}>👤 {user?.email}</p>
            <p style={{ margin: "5px 0", color: "#1d4ed8" }}>🔑 Rol: <strong>{role}</strong></p>
            <div className="user-uid-box" style={{ margin: "10px 0", padding: 8, background: "#f1f5f9", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
              <code style={{ fontSize: 11, wordBreak: "break-all" }}>🆔 {user?.uid}</code>
              <button onClick={copyUidToClipboard} style={{ background: copiedUid ? "#22c55e" : "#64748b", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 4, fontSize: 11, cursor: "pointer", fontWeight: 500 }}>{copiedUid ? "✅ Copiado" : "📋 Copiar"}</button>
            </div>
            <button onClick={logout} style={btnDanger}>🚪 Cerrar sesión</button>
          </div>

          {/* ✍️ FORMULARIO ARTÍCULOS */}
          <div style={{ background: "#ffffff", padding: 25, borderRadius: 12, maxWidth: 600, margin: "30px auto", boxShadow: "0 6px 18px rgba(0,0,0,0.2)" }}>
            <h2 style={{ color: "#020617", background: "#e2e8f0", padding: "10px", borderRadius: "8px", display: "inline-block", fontWeight: "900", fontFamily: "Georgia, serif" }}>✍️ {editingId ? "Editar artículo" : "Crear artículo"}</h2>
            <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Título" style={{ width: "100%", marginBottom: 10, padding: 10 }} />
            <textarea className="form-textarea" value={content} onChange={e => setContent(e.target.value)} placeholder="Contenido" style={{ width: "100%", marginBottom: 10, padding: 10, minHeight: 120 }} />
            <select className="form-select" value={category} onChange={e => setCategory(e.target.value)} style={{ width: "100%", padding: 10, marginBottom: 10 }}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <input className="form-input" value={image} onChange={e => setImage(e.target.value)} placeholder="URL de Cloudinary" style={{ width: "100%", marginBottom: 5, padding: 10 }} />
            {image && <img src={image} style={{ maxWidth: "100%", maxHeight: 150, marginTop: 10, borderRadius: 8, objectFit: "cover" }} alt="Preview" onError={(e) => { e.target.style.display = 'none'; }} />}
            <br /><br />
            <button onClick={publish} style={btnPrimary}>{editingId ? "💾 Guardar cambios" : "🚀 Publicar"}</button>
            {editingId && <button onClick={() => { setEditingId(null); setTitle(""); setContent(""); setImage(""); }} style={{ ...btnDanger, marginLeft: 10 }}>Cancelar</button>}
          </div>

          {/* 👤 GESTIÓN USUARIOS */}
          <div style={{ background: "#fff", padding: 20, marginBottom: 30, borderRadius: 10, marginTop: 30 }}>
            <h2 style={{ color: "#020617", background: "#e2e8f0", padding: "10px", borderRadius: "8px", display: "inline-block", fontWeight: "900", fontFamily: "Georgia, serif" }}>👤 Usuarios del sistema</h2>
            <div className="admin-buttons" style={{ marginTop: 15, display: "flex", gap: 10, flexWrap: "wrap" }}>
              {role === "owner" && <button onClick={makeAdmin} style={btnPrimary}>➕ Admin</button>}
              <button onClick={makeEditor} style={btnPrimary}>➕ Editor</button>
            </div>
            <div style={{ marginTop: 15 }}>
              {users.map(u => (
                <div className="user-card" key={u.uid} style={{ marginBottom: 10, padding: 10, background: "#f8fafc", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <p style={{ margin: 0, fontWeight: "bold" }}>📧 {u.email || "Sin email"}</p>
                    <p style={{ margin: "4px 0 0 0", fontSize: 12, color: "#64748b", wordBreak: "break-all" }}>🆔 {u.uid}</p>
                    <p style={{ margin: "4px 0 0 0", color: "#1d4ed8" }}>🔑 Rol: <strong>{u.role}</strong></p>
                  </div>
                  <div className="user-card-actions">
                    <button onClick={() => toggleRole(u.uid, u.role)} style={btnPrimary}>🔄 Cambiar rol</button>
                    <button onClick={() => deleteUserRole(u.uid)} style={btnDanger}>❌ Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 🔧 GESTIÓN ENLACES */}
          <div style={{ background: "#fff", padding: 20, borderRadius: 10 }}>
            <h2 style={{ color: "#020617", background: "#e2e8f0", padding: "10px", borderRadius: "8px", display: "inline-block", fontWeight: "900", fontFamily: "Georgia, serif" }}>🔧 Gestionar Enlaces</h2>
            <div style={{ marginTop: 15, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input value={newLinkName} onChange={e => setNewLinkName(e.target.value)} placeholder="Nombre del sitio" style={{ flex: 1, padding: 10, borderRadius: 6, border: "1px solid #cbd5e1" }} />
              <input value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)} placeholder="https://..." style={{ flex: 2, padding: 10, borderRadius: 6, border: "1px solid #cbd5e1" }} />
              <button onClick={addLink} style={btnPrimary}>➕ Añadir</button>
            </div>
            <div style={{ marginTop: 15 }}>
              {links.map(l => (
                <div key={l.id} style={{ marginBottom: 8, padding: 8, background: "#f8fafc", borderRadius: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 500 }}>{l.name}</span>
                  <button onClick={() => removeLink(l.id)} style={{ ...btnDanger, padding: "6px 12px", fontSize: 12 }}>❌</button>
                </div>
              ))}
            </div>
          </div>

          {/* 📊 REGISTRO DE ACTIVIDAD */}
          <div style={{ background: "#fff", padding: 20, borderRadius: 10, marginTop: 30 }}>
            <h2 style={{ color: "#020617", background: "#e2e8f0", padding: "10px", borderRadius: "8px", display: "inline-block", fontWeight: "900", fontFamily: "Georgia, serif" }}>📜 Registro de Actividad</h2>
            <div style={{ marginTop: 15, maxHeight: 300, overflowY: "auto", background: "#f8fafc", padding: 10, borderRadius: 8 }}>
              {activityLogs.length > 0 ? activityLogs.map(log => (
                <div key={log.id} style={{ marginBottom: 8, padding: 8, borderBottom: "1px solid #e2e8f0", fontSize: 13 }}>
                  <span style={{ fontWeight: "bold", color: "#1e3a8a" }}>[{new Date(log.timestamp).toLocaleString()}]</span>
                  <span style={{ color: "#64748b", marginLeft: 8 }}>{log.userEmail}</span>
                  <span style={{ marginLeft: 8 }}>→ <strong>{log.type.replace(/_/g, " ").toUpperCase()}</strong></span>
                  <p style={{ margin: "4px 0 0 0", color: "#334155" }}>{log.details}</p>
                </div>
              )) : <p style={{ textAlign: "center", color: "#64748b", padding: 20 }}>No hay registros recientes.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}