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
import mammoth from "mammoth";

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
  background: "#1d4ed8", color: "#fff", padding: "14px 20px", borderRadius: 10,
  border: "none", cursor: "pointer", marginRight: 10, fontWeight: "bold",
  fontSize: "16px", minHeight: "48px"
};

const btnDanger = {
  background: "#b91c1c", color: "#fff", padding: "14px 20px", borderRadius: 10,
  border: "none", cursor: "pointer", fontWeight: "bold",
  fontSize: "16px", minHeight: "48px"
};

const btnPDF = {
  background: "#0f172a", color: "#fff", padding: "10px 16px", borderRadius: 8,
  border: "none", cursor: "pointer", fontWeight: "600", fontSize: "14px",
  width: "100%", marginTop: 10
};

const cardStyle = {
  background: "#ffffff",
  padding: "20px",
  borderRadius: "12px",
  marginBottom: "20px",
  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
  border: "1px solid #e2e8f0"
};

const inputStyle = {
  width: "100%", padding: "12px", marginBottom: "15px", borderRadius: "8px",
  border: "1px solid #cbd5e1", fontSize: "15px", boxSizing: "border-box"
};

const cssStyles = `
  .badge-new {
    display: inline-block; background: linear-gradient(135deg, #fbbf24, #d97706);
    color: #fff; padding: 2px 8px; border-radius: 12px; font-size: 11px;
    font-weight: 900; text-transform: uppercase; margin-left: 8px;
  }
  .accordion-header {
    background: #e2e8f0; padding: 15px; border-radius: 10px; cursor: pointer;
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 10px; border-left: 5px solid #1d4ed8;
  }
  .accordion-header:hover { background: #cbd5e1; }
  .accordion-header.active { border-left: 5px solid #fbbf24; background: #fff; }
  .accordion-icon { font-size: 20px; transition: transform 0.3s; }
  .accordion-icon.open { transform: rotate(180deg); }
  .accordion-content {
    max-height: 5000px; overflow: hidden; transition: max-height 0.5s ease-out;
  }
  .accordion-content.closed { max-height: 0; pointer-events: none; }
  .import-zone {
    border: 2px dashed #cbd5e1; border-radius: 12px; padding: 30px;
    text-align: center; background: #f8fafc; cursor: pointer; margin-bottom: 20px;
  }
  .import-zone:hover { border-color: #d97706; background: #fffbeb; }
  
  @media (max-width: 640px) {
    .nav-buttons { display: flex; flex-direction: column; gap: 10px; }
    .nav-buttons button { width: 100%; margin: 0; }
    .article-actions { display: flex; flex-direction: column; gap: 8px; }
    .article-actions button { width: 100%; margin: 0; }
  }
  @media (min-width: 641px) {
    .nav-buttons { display: flex; flex-direction: row; justify-content: center; gap: 0; }
    .nav-buttons button { margin-right: 10px; }
  }
`;

// ==============================
// 🚀 APP
// ==============================

export default function App() {
  const [articles, setArticles] = useState([]);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [users, setUsers] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [editingId, setEditingId] = useState(null);
  
  const [view, setView] = useState("home");
  const [links, setLinks] = useState([]);
  const [newLinkName, setNewLinkName] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [openCategories, setOpenCategories] = useState(["Edad Antigua"]);
  const [isImporting, setIsImporting] = useState(false);

  // ==============================
  // AUTH & ROLES
  // ==============================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          let userRole = null;
          const uidRef = doc(db, "roles", u.uid);
          const uidSnap = await getDoc(uidRef);
          if (uidSnap.exists()) userRole = uidSnap.data().role;
          else if (u.email) {
            const emailSnap = await getDoc(doc(db, "roles", u.email));
            if (emailSnap.exists()) {
              userRole = emailSnap.data().role;
              await setDoc(uidRef, { role: userRole, email: u.email });
              await deleteDoc(doc(db, "roles", u.email));
            }
          }
          if (!userRole) {
            await setDoc(uidRef, { role: "lector", email: u.email });
            userRole = "lector";
            alert("👋 Bienvenido. Cuenta creada como LECTOR.");
          }
          setRole(userRole);
        } catch (err) { setRole("lector"); }
      } else { setRole(null); }
    });
    return () => unsubscribe();
  }, []);

  // ==============================
  // CARGA DE DATOS
  // ==============================
  useEffect(() => {
    const loadData = async () => {
      const load = async (col, setter) => {
        const snap = await getDocs(collection(db, col));
        setter(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      };
      await load("roles", setUsers);
      await load("articles", setArticles);
      await load("links", setLinks);
      
      if (role === "owner" || role === "admin") {
        const logSnap = await getDocs(collection(db, "activity_log"));
        const logs = logSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setActivityLogs(logs.slice(0, 50));
      }
    };
    loadData();
  }, [role]);

  // ==============================
  // FUNCIONES AUXILIARES
  // ==============================
  const login = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);
  const checkAuth = () => { if (!user) { alert("🔒 Inicia sesión"); return false; } return true; };
  
  const logActivity = async (type, details) => {
    try {
      await addDoc(collection(db, "activity_log"), {
        type, details, userEmail: user?.email || "Sistema",
        userId: user?.uid || "Sistema", timestamp: new Date().toISOString()
      });
    } catch (err) {}
  };

  const toggleCategory = (cat) => {
    setOpenCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const isNew = (a) => a.createdAt && (new Date() - new Date(a.createdAt) < 7 * 24 * 60 * 60 * 1000);

  // ==============================
  // 🆕 IMPORTADOR
  // ==============================
  const handleFileImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsImporting(true);
    try {
      if (file.name.endsWith('.txt')) {
        const text = await file.text();
        setContent(text);
        if (!title) setTitle(file.name.replace('.txt', ''));
        alert("✅ Texto importado");
      } else if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setContent(result.value);
        if (!title) setTitle(file.name.replace('.docx', ''));
        alert("✅ Word importado");
      }
    } catch (err) {
      alert("❌ Error al importar");
    } finally {
      setIsImporting(false);
      e.target.value = null;
    }
  };

  // ==============================
  // CRUD
  // ==============================
  const publish = async () => {
    if (!checkAuth()) return;
    if (!title || !content) return alert("❌ Rellena título y contenido");
    
    const data = {
      title, content, category, image: image || "",
      date: new Date().toLocaleDateString(),
      author: user.email, authorId: user.uid,
      updatedAt: new Date().toISOString(),
      createdAt: editingId ? undefined : new Date().toISOString()
    };

    if (editingId) await updateDoc(doc(db, "articles", editingId), data);
    else await addDoc(collection(db, "articles"), data);

    logActivity(editingId ? "actualizado" : "creado", `"${title}"`);
    const snap = await getDocs(collection(db, "articles"));
    setArticles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setTitle(""); setContent(""); setImage(""); setEditingId(null);
  };

  const removeArticle = async (id) => {
    if (!confirm("¿Eliminar?")) return;
    await deleteDoc(doc(db, "articles", id));
    const snap = await getDocs(collection(db, "articles"));
    setArticles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  // ==============================
  // ROLES
  // ==============================
  const makeAdmin = async () => {
    const t = prompt("UID o Email del ADMIN:");
    if (!t) return;
    await setDoc(doc(db, "roles", t), { role: "admin" });
    logActivity("admin_asignado", t);
    alert("✅ Admin asignado");
  };
  const makeEditor = async () => {
    const t = prompt("UID o Email del EDITOR:");
    if (!t) return;
    await setDoc(doc(db, "roles", t), { role: "editor" });
    logActivity("editor_asignado", t);
    alert("✅ Editor asignado");
  };

  // ==============================
  // ENLACES
  // ==============================
  const addLink = async () => {
    if (!newLinkName || !newLinkUrl) return alert("Completa los campos");
    await addDoc(collection(db, "links"), { name: newLinkName, url: newLinkUrl });
    logActivity("enlace_creado", newLinkName);
    const snap = await getDocs(collection(db, "links"));
    setLinks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };
  const removeLink = async (id) => {
    await deleteDoc(doc(db, "links", id));
    const snap = await getDocs(collection(db, "links"));
    setLinks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  // ==============================
  // PDF
  // ==============================
  const exportToPDF = async (a) => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');
      const temp = document.createElement('div');
      temp.innerHTML = `
        <h1 style="color:#1e3a8a">🏛️ HISPANIA IMPERIAL</h1>
        <h2>${a.title}</h2>
        <p>${a.content}</p>
        <hr>
        <small>Generado desde Hispania Imperial</small>
      `;
      document.body.appendChild(temp);
      const canvas = await html2canvas(temp);
      const pdf = new jsPDF();
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 10, 190, 0);
      pdf.save(`${a.title}.pdf`);
      document.body.removeChild(temp);
      logActivity('pdf_descargado', `"${a.title}"`);
    } catch (e) { alert("Error PDF"); }
  };

  // ==============================
  // TELEGRAM
  // ==============================
  const sendToTelegram = async (a) => {
    if (!checkAuth()) return;
    const lastSend = localStorage.getItem(`tg_cooldown_${user.uid}`);
    if (lastSend && (Date.now() - parseInt(lastSend)) < 300000) {
      return alert(`⏳ Espera ${Math.ceil((300000 - (Date.now() - parseInt(lastSend))) / 1000)}s`);
    }
    if (!confirm("¿Enviar a Telegram?")) return;

    const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
    const CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;
    if (!BOT_TOKEN || !CHAT_ID) return alert("⚠️ Credenciales Telegram faltantes");

    const safeTitle = a.title.replace(/[*_`~[\]\\]/g, "");
    const safeContent = a.content.replace(/[*_`~[\]\\]/g, "");
    const header = `📜 *${safeTitle}*\n\n`;
    
    try {
      if (a.image) {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: CHAT_ID, photo: a.image, caption: header, parse_mode: "Markdown" })
        });
      }
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: CHAT_ID, text: header + safeContent, parse_mode: "Markdown" })
      });
      
      localStorage.setItem(`tg_cooldown_${user.uid}`, Date.now().toString());
      logActivity("telegram_enviado", `"${a.title}"`);
      alert("✅ Enviado a Telegram");
    } catch (err) { alert("❌ Error Telegram"); }
  };

  // ==============================
  // 🎨 UI
  // ==============================
  return (
    <div style={{ background: "#f1f5f9", minHeight: "100vh", padding: 20, fontFamily: "Segoe UI, Arial", color: "#111" }}>
      <style>{cssStyles}</style>
      
      {/* HEADER */}
      <h1 style={{ textAlign: "center", fontSize: "36px", fontWeight: "900", color: "#020617", marginBottom: 20 }}>
        📜 Historia de España
      </h1>

      {/* NAV */}
      <div className="nav-buttons" style={{ textAlign: "center", marginBottom: 30 }}>
        <button onClick={() => setView("home")} style={btnPrimary}>🏠 Inicio</button>
        <button onClick={() => setView("articles")} style={btnPrimary}>📚 Artículos</button>
        <button onClick={() => setView("links")} style={btnPrimary}>🔗 Enlaces</button>
        {(role === "owner" || role === "admin") && (
          <button onClick={() => setView("admin")} style={btnDanger}>⚙️ Admin</button>
        )}
      </div>

      {/* INICIO - PORTADA IMPERIAL COMPLETA */}
      {view === "home" && (
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <div style={{ marginBottom: 30 }}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/8/8b/Escudo_de_los_Reyes_Catolicos_%281475-1492%29.svg" 
                 alt="Escudo" style={{ width: 220, filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))" }} />
          </div>
          <div style={{ 
            background: "linear-gradient(135deg, #1e3a8a 0%, #7c2d12 100%)", 
            color: "#fbbf24", padding: "30px 20px", borderRadius: 15, marginBottom: 40,
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)", border: "3px solid #fbbf24"
          }}>
            <h2 style={{ fontSize: "52px", fontWeight: "900", margin: 0, letterSpacing: "4px", fontFamily: "Georgia" }}>
              🏛️ HISPANIA IMPERIAL 🏛️
            </h2>
            <p style={{ fontSize: "22px", marginTop: 15, fontStyle: "italic", color: "#fef3c7" }}>PLUS ULTRA</p>
          </div>
          
          {/* POEMA */}
          <div style={{ background: "#fff", padding: 40, borderRadius: 15, marginBottom: 40, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", border: "2px solid #e2e8f0" }}>
            <h3 style={{ fontSize: "24px", color: "#1e3a8a", marginBottom: 25, borderBottom: "2px solid #fbbf24", paddingBottom: 10 }}>
              📜 España - Jorge Doré
            </h3>
            <div style={{ fontSize: "16px", lineHeight: 2.2, color: "#334155", fontStyle: "italic", fontFamily: "Georgia" }}>
              <p style={{ margin: "15px 0", fontWeight: "600" }}>
                ¡Qué triste España y qué amargo,<br />
                es ver como te debates<br />
                a vida o muerte entre turbas<br />
                de apóstatas y desleales!
              </p>
              <p style={{ margin: "15px 0", fontWeight: "600" }}>
                ¡Qué lamentable cortejo<br />
                de alimañas insaciables<br />
                te timonea escorada...
              </p>
            </div>
          </div>

          {!user && (
            <button onClick={login} style={{...btnPrimary, fontSize: "18px", padding: "15px 30px"}}>
              🔐 Iniciar Sesión
            </button>
          )}
        </div>
      )}

      {/* ARTÍCULOS */}
      {view === "articles" && (
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          {CATEGORIES.map(cat => {
            const catArts = articles.filter(a => a.category === cat);
            if (!catArts.length) return null;
            return (
              <div key={cat}>
                <div className={`accordion-header ${openCategories.includes(cat) ? 'active' : ''}`} onClick={() => toggleCategory(cat)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className={`accordion-icon ${openCategories.includes(cat) ? 'open' : ''}`}>▶</span>
                    <span style={{ fontWeight: "bold", fontSize: 18 }}>📚 {cat}</span>
                    <span style={{ background: "#cbd5e1", borderRadius: 20, padding: "2px 8px", fontSize: 12 }}>{catArts.length}</span>
                  </div>
                  {catArts.some(isNew) && <span className="badge-new">🆕</span>}
                </div>
                <div className={`accordion-content ${openCategories.includes(cat) ? '' : 'closed'}`}>
                  {catArts.map(a => (
                    <div key={a.id} style={cardStyle}>
                      <h3 style={{ margin: "0 0 10px 0", fontFamily: "Georgia" }}>
                        {a.title} {isNew(a) && <span className="badge-new">✨ NUEVO</span>}
                      </h3>
                      <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6, color: "#334155" }}>{a.content}</p>
                      {a.image && <img src={a.image} style={{ maxWidth: "100%", marginTop: 15, borderRadius: 8 }} alt={a.title} />}
                      
                      <div className="article-actions" style={{ marginTop: 15, display: "flex", gap: 10, flexWrap: "wrap" }}>
                        {user && (role === "owner" || role === "admin" || (role === "editor" && a.authorId === user.uid)) && (
                          <>
                            <button onClick={() => { setTitle(a.title); setContent(a.content); setCategory(a.category); setImage(a.image); setEditingId(a.id); setView('admin'); }} style={btnPrimary}>✏️ Editar</button>
                            <button onClick={() => removeArticle(a.id)} style={btnDanger}>🗑️ Borrar</button>
                            <button onClick={() => sendToTelegram(a)} style={{...btnPrimary, background:"#22c55e"}}>📤 Telegram</button>
                          </>
                        )}
                        <button onClick={() => exportToPDF(a)} style={btnPDF}>📥 Descargar PDF</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ENLACES */}
      {view === "links" && (
        <div style={{ maxWidth: 800, margin: "40px auto" }}>
          <h2 style={{ fontWeight: "900", fontSize: "26px", color: "#020617", background: "#e2e8f0", padding: "10px", borderRadius: "8px", display: "inline-block", fontFamily: "Georgia" }}>
            🔗 Enlaces de Interés
          </h2>
          <div style={{ marginTop: 20, display: "grid", gap: 15 }}>
            {links.map(link => (
              <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" 
                 style={{ display: "block", padding: 15, background: "#fff", borderRadius: 10, fontWeight: "700", color: "#0f172a", textDecoration: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                🔗 {link.name}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ADMINISTRACIÓN */}
      {view === "admin" && (role === "owner" || role === "admin") && (
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          
          {/* INFO USUARIO */}
          <div style={cardStyle}>
            <div style={{ textAlign: "center", marginBottom: 15 }}>
              <p style={{ margin: "5px 0", fontWeight: 500 }}>👤 {user?.email}</p>
              <p style={{ margin: "5px 0", color: "#1d4ed8" }}>🔑 Rol: <strong>{role}</strong></p>
              <button onClick={logout} style={btnDanger}>🚪 Cerrar Sesión</button>
            </div>
          </div>

          {/* IMPORTADOR */}
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0, borderBottom: "2px solid #fbbf24", paddingBottom: 10 }}>📂 Importar Contenido</h2>
            <p style={{ color: "#64748b", marginBottom: 15 }}>Sube un archivo <strong>.docx</strong> o <strong>.txt</strong> para extraer su texto.</p>
            <label className="import-zone">
              <div style={{ fontSize: 40, marginBottom: 10 }}>📄</div>
              <p style={{ fontWeight: "bold", margin: 0 }}>Haz clic para seleccionar archivo</p>
              <input type="file" accept=".docx,.txt" onChange={handleFileImport} style={{ display: 'none' }} />
            </label>
            {isImporting && <p style={{ textAlign: "center", color: "#1d4ed8" }}>⏳ Procesando...</p>}
          </div>

          {/* EDITOR */}
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>{editingId ? "✏️ Editar Artículo" : "🚀 Publicar Artículo"}</h2>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título" style={inputStyle} />
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Contenido" style={{...inputStyle, minHeight: 150}} />
            <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <input value={image} onChange={e => setImage(e.target.value)} placeholder="URL de Imagen (Cloudinary)" style={inputStyle} />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={publish} style={btnPrimary}>{editingId ? "💾 Guardar" : "🚀 Publicar"}</button>
              {editingId && <button onClick={() => { setEditingId(null); setTitle(""); setContent(""); }} style={btnDanger}>Cancelar</button>}
            </div>
          </div>

          {/* GESTIÓN USUARIOS */}
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>👥 Gestión de Usuarios</h2>
            <div style={{ display: "flex", gap: 10, marginBottom: 15 }}>
              {role === "owner" && <button onClick={makeAdmin} style={btnPrimary}>➕ Admin</button>}
              <button onClick={makeEditor} style={btnPrimary}>➕ Editor</button>
            </div>
            <div>
              {users.map(u => (
                <div key={u.uid} style={{ padding: 10, borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between" }}>
                  <span>{u.email || u.uid}</span>
                  <span style={{ fontWeight: "bold", color: "#1d4ed8" }}>{u.role}</span>
                </div>
              ))}
            </div>
          </div>

          {/* GESTIÓN ENLACES */}
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>🔧 Gestión de Enlaces</h2>
            <div style={{ display: "flex", gap: 10, marginBottom: 15 }}>
              <input value={newLinkName} onChange={e => setNewLinkName(e.target.value)} placeholder="Nombre" style={{...inputStyle, marginBottom: 0, flex: 1}} />
              <input value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)} placeholder="https://..." style={{...inputStyle, marginBottom: 0, flex: 2}} />
              <button onClick={addLink} style={btnPrimary}>➕ Añadir</button>
            </div>
            {links.map(l => (
              <div key={l.id} style={{ padding: 8, borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>{l.name}</span>
                <button onClick={() => removeLink(l.id)} style={{...btnDanger, padding: "5px 10px", fontSize: 12}}>❌</button>
              </div>
            ))}
          </div>

          {/* REGISTRO DE ACTIVIDAD */}
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>📜 Registro de Actividad</h2>
            <div style={{ maxHeight: 200, overflowY: "auto", background: "#f8fafc", padding: 10, borderRadius: 8 }}>
              {activityLogs.length > 0 ? activityLogs.map(log => (
                <div key={log.id} style={{ padding: 8, borderBottom: "1px solid #e2e8f0", fontSize: 13 }}>
                  <span style={{ fontWeight: "bold", color: "#1e3a8a" }}>[{new Date(log.timestamp).toLocaleString()}]</span>
                  <span style={{ color: "#64748b", marginLeft: 8 }}>{log.userEmail}</span>
                  <span style={{ marginLeft: 8, fontWeight: 600 }}>→ <strong>{log.type.toUpperCase()}</strong></span>
                  <p style={{ margin: "4px 0 0 0", color: "#334155" }}>{log.details}</p>
                </div>
              )) : <p style={{ textAlign: "center", color: "#64748b" }}>No hay registros.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}