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
import mammoth from "mammoth"; // 🆕 Importador de Word

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
  fontSize: "16px", minHeight: "48px", touchAction: "manipulation"
};

const btnDanger = {
  background: "#b91c1c", color: "#fff", padding: "14px 20px", borderRadius: 10,
  border: "none", cursor: "pointer", fontWeight: "bold",
  fontSize: "16px", minHeight: "48px", touchAction: "manipulation"
};

const btnPDF = {
  background: "#0f172a", color: "#fff", padding: "10px 16px", borderRadius: 8,
  border: "none", cursor: "pointer", fontWeight: "600", fontSize: "14px",
  width: "100%", marginTop: 10, touchAction: "manipulation"
};

// Estilos CSS
const styles = `
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  button { transition: transform 0.1s, opacity 0.2s; }
  button:active { transform: scale(0.98); opacity: 0.9; }

  .badge-new {
    display: inline-block; background: linear-gradient(135deg, #fbbf24, #d97706);
    color: #fff; padding: 2px 8px; border-radius: 12px; font-size: 11px;
    font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;
    margin-left: 8px; vertical-align: middle; box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }

  .accordion-header {
    background: #e2e8f0; padding: 15px; border-radius: 10px; cursor: pointer;
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 10px; transition: background 0.2s; border-left: 5px solid #1d4ed8;
  }
  .accordion-header:hover { background: #cbd5e1; }
  .accordion-header.active { border-left: 5px solid #fbbf24; background: #fff; }
  .accordion-icon { font-size: 20px; transition: transform 0.3s; }
  .accordion-icon.open { transform: rotate(180deg); }

  .accordion-content {
    max-height: 5000px; overflow: hidden; transition: max-height 0.5s ease-out, opacity 0.5s ease-out; opacity: 1;
  }
  .accordion-content.closed { max-height: 0; opacity: 0; pointer-events: none; }

  .import-zone {
    border: 2px dashed #cbd5e1; border-radius: 12px; padding: 25px;
    text-align: center; background: #f8fafc; margin-bottom: 25px;
    transition: all 0.2s; cursor: pointer;
  }
  .import-zone:hover { border-color: #d97706; background: #fffbeb; }

  @media (max-width: 640px) {
    .nav-buttons { display: flex; flex-direction: column; gap: 10px; align-items: stretch; }
    .nav-buttons button { width: 100%; margin: 0; padding: 16px 20px; font-size: 16px; }
    .article-actions { display: flex; flex-direction: column; gap: 8px; }
    .article-actions button { width: 100%; margin: 0; padding: 14px 16px; }
    input, textarea, select { font-size: 16px !important; }
  }
  @media (min-width: 1025px) {
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
  const [copiedUid, setCopiedUid] = useState(false);
  
  const [openCategories, setOpenCategories] = useState(["Edad Antigua"]);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState("");

  // ==============================
  // 📝 REGISTRO ACTIVIDAD
  // ==============================
  const logActivity = async (type, details = "") => {
    try {
      await addDoc(collection(db, "activity_log"), {
        type, details, userEmail: user?.email || "Sistema",
        userId: user?.uid || "Sistema", timestamp: new Date().toISOString()
      });
    } catch (err) { console.error("Error log:", err); }
  };

  useEffect(() => {
    const loadLogs = async () => {
      if (role !== "owner" && role !== "admin") return;
      const snap = await getDocs(collection(db, "activity_log"));
      const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setActivityLogs(logs.slice(0, 50));
    };
    loadLogs();
  }, [role]);

  // ==============================
  // 🔐 AUTH & ROLES
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
            await setDoc(uidRef, { role: "lector", email: u.email, createdAt: new Date().toISOString() });
            userRole = "lector";
            if (!localStorage.getItem('welcomed_' + u.uid)) {
              alert("👋 Bienvenido. Cuenta creada como LECTOR.");
              localStorage.setItem('welcomed_' + u.uid, 'true');
            }
          }
          setRole(userRole);
        } catch (err) { setRole("lector"); }
      } else { setRole(null); }
    });
    return () => unsubscribe();
  }, []);

  // ==============================
  // CARGA DATOS
  // ==============================
  useEffect(() => {
    const load = async (col, setter) => {
      const snap = await getDocs(collection(db, col));
      setter(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    load("roles", setUsers);
    load("articles", setArticles);
    load("links", setLinks);
  }, []);

  const login = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);
  const copyUid = () => {
    if (user?.uid) { navigator.clipboard.writeText(user.uid); setCopiedUid(true); setTimeout(() => setCopiedUid(false), 2000); }
  };
  const checkAuth = () => { if (!user) { alert("🔒 Inicia sesión"); return false; } return true; };

  // ==============================
  // GESTIÓN ROLES
  // ==============================
  const makeAdmin = async () => {
    if (role !== "owner") return;
    const t = prompt("UID o Email del nuevo ADMIN:");
    if (!t) return;
    await setDoc(doc(db, "roles", t), { role: "admin", updatedAt: new Date().toISOString() });
    logActivity("rol_asignado", `${t} -> ADMIN`);
    alert("✅ Asignado.");
  };
  const makeEditor = async () => {
    if (role !== "owner" && role !== "admin") return;
    const t = prompt("UID o Email del nuevo EDITOR:");
    if (!t) return;
    await setDoc(doc(db, "roles", t), { role: "editor", updatedAt: new Date().toISOString() });
    logActivity("rol_asignado", `${t} -> EDITOR`);
    alert("✅ Asignado.");
  };

  // ==============================
  // 🆕 IMPORTADOR DE ARCHIVOS
  // ==============================
  const handleFileImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsImporting(true);
    setImportError("");

    try {
      if (file.name.endsWith('.txt')) {
        const text = await file.text();
        setContent(text);
        if (!title) setTitle(file.name.replace('.txt', ''));
        alert("✅ Archivo .txt importado.");
      } else if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setContent(result.value);
        if (!title) setTitle(file.name.replace('.docx', ''));
        alert("✅ Documento Word importado.");
      } else {
        setImportError("⚠️ Usa archivos .docx o .txt");
      }
    } catch (err) {
      setImportError("❌ Error al leer archivo.");
    } finally {
      setIsImporting(false);
      e.target.value = null;
    }
  };

  // ==============================
  // CRUD ARTÍCULOS
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

    logActivity(editingId ? "articulo_actualizado" : "articulo_creado", `"${title}"`);
    const snap = await getDocs(collection(db, "articles"));
    setArticles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setTitle(""); setContent(""); setImage(""); setEditingId(null);
  };

  const startEdit = (a) => {
    if (!checkAuth()) return;
    setTitle(a.title); setContent(a.content); setCategory(a.category);
    setImage(a.image || ""); setEditingId(a.id); setView("admin");
  };

  const removeArticle = async (id) => {
    if (!checkAuth()) return;
    if (!confirm("¿Eliminar?")) return;
    await deleteDoc(doc(db, "articles", id));
    logActivity("articulo_eliminado", `ID: ${id}`);
    const snap = await getDocs(collection(db, "articles"));
    setArticles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  // ==============================
  // 📤 TELEGRAM (COMPLETO)
  // ==============================
  const sendToTelegram = async (a) => {
    if (!checkAuth()) return;
    const lastSend = localStorage.getItem(`tg_cooldown_${user.uid}`);
    if (lastSend && (Date.now() - parseInt(lastSend)) < 300000) {
      return alert(`⏳ Anti-Spam: Espera ${Math.ceil((300000 - (Date.now() - parseInt(lastSend))) / 1000)}s.`);
    }
    if (!confirm("¿Enviar a Telegram?")) return;

    const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
    const CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;
    if (!BOT_TOKEN || !CHAT_ID) return alert("⚠️ Credenciales Telegram faltantes.");

    const safeTitle = a.title.replace(/[*_`~[\]\\]/g, "");
    const safeContent = a.content.replace(/[*_`~[\]\\]/g, "");
    const header = `📜 *${safeTitle}*\n\n`;
    
    const splitText = (text, len = 4000) => {
      const chunks = [];
      for(let i=0; i<text.length; i+=len) chunks.push(text.substring(i, i+len));
      return chunks;
    };

    try {
      if (a.image) {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: CHAT_ID, photo: a.image, caption: header, parse_mode: "Markdown" })
        });
      }
      
      const chunks = splitText(safeContent);
      for(let i=0; i<chunks.length; i++) {
        const suffix = i === chunks.length -1 ? "\n\n🔗 " + window.location.origin : "\n\n*(continúa...)*";
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: CHAT_ID, text: chunks[i] + suffix, parse_mode: "Markdown" })
        });
      }
      
      localStorage.setItem(`tg_cooldown_${user.uid}`, Date.now().toString());
      logActivity("telegram_enviado", `"${a.title}"`);
      alert("✅ Enviado.");
    } catch (err) { alert("❌ Error Telegram"); }
  };

  // ==============================
  // 📥 PDF (COMPLETO)
  // ==============================
  const exportToPDF = async (a) => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');
      
      const tempDiv = document.createElement('div');
      tempDiv.style.cssText = `position:absolute;left:-9999px;width:794px;padding:40px;background:#fff;font-family:Georgia,serif;color:#111;line-height:1.6;`;
      tempDiv.innerHTML = `
        <div style="text-align:center;border-bottom:3px solid #fbbf24;padding-bottom:20px;margin-bottom:30px;">
          <h1 style="font-size:28px;color:#1e3a8a;margin:0;">🏛️ HISPANIA IMPERIAL</h1>
          <p style="color:#7c2d12;font-style:italic;">PLUS ULTRA</p>
        </div>
        <h2 style="font-size:24px;margin-bottom:10px;">${a.title}</h2>
        <p style="color:#64748b;font-size:14px;">📚 ${a.category} • 📅 ${a.date} • ✍️ ${a.author}</p>
        ${a.image ? `<img src="${a.image}" style="max-width:100%;margin:20px 0;border-radius:8px;" crossorigin="anonymous" />` : ''}
        <div style="font-size:15px;white-space:pre-wrap;margin:20px 0;">${a.content}</div>
        <div style="margin-top:40px;border-top:2px solid #e2e8f0;padding-top:20px;text-align:center;font-size:12px;color:#64748b;">
          <p>Generado desde Hispania Imperial</p>
          <p>🔗 ${window.location.origin}</p>
          <p style="font-style:italic;">"La historia bien contada es el mejor antídoto contra la leyenda"</p>
        </div>
      `;
      document.body.appendChild(tempDiv);
      
      const canvas = await html2canvas(tempDiv, { scale: 2, useCORS: true });
      const img = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      pdf.addImage(img, 'PNG', 0, 0, 210, (canvas.height * 210) / canvas.width);
      pdf.save(`Hispania_${a.title}.pdf`);
      
      document.body.removeChild(tempDiv);
      logActivity('pdf_descargado', `"${a.title}"`);
    } catch (err) { alert("❌ Error PDF"); }
  };

  // ==============================
  // 🔗 ENLACES
  // ==============================
  const addLink = async () => {
    if (!newLinkName || !newLinkUrl) return alert("Rellena nombre y URL");
    await addDoc(collection(db, "links"), { name: newLinkName, url: newLinkUrl });
    logActivity("enlace_creado", newLinkName);
    const snap = await getDocs(collection(db, "links"));
    setLinks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };
  const removeLink = async (id) => {
    if (!confirm("¿Eliminar enlace?")) return;
    await deleteDoc(doc(db, "links", id));
    logActivity("enlace_eliminado", `ID: ${id}`);
    const snap = await getDocs(collection(db, "links"));
    setLinks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  // ==============================
  // HELPERS
  // ==============================
  const toggleCategory = (cat) => setOpenCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  const isNew = (a) => a.createdAt && (new Date() - new Date(a.createdAt) < 7 * 24 * 60 * 60 * 1000);

  // ==============================
  // 🎨 UI
  // ==============================
  return (
    <div style={{ background: "#f1f5f9", minHeight: "100vh", padding: 20, fontFamily: "Segoe UI, Arial", color: "#111" }}>
      <style>{styles}</style>
      <h1 style={{ textAlign: "center", fontSize: "36px", fontWeight: "900", color: "#020617" }}>📜 Historia de España</h1>

      {/* NAV */}
      <div className="nav-buttons" style={{ textAlign: "center", marginBottom: 20 }}>
        <button onClick={() => setView("home")} style={btnPrimary}>🏠 Inicio</button>
        <button onClick={() => setView("articles")} style={btnPrimary}>📚 Artículos</button>
        <button onClick={() => setView("links")} style={btnPrimary}>🔗 Enlaces</button>
        {(role === "owner" || role === "admin") && <button onClick={() => setView("admin")} style={btnDanger}>⚙️ Admin</button>}
      </div>

      {/* INICIO */}
      {view === "home" && (
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <img src="https://upload.wikimedia.org/wikipedia/commons/8/8b/Escudo_de_los_Reyes_Catolicos_%281475-1492%29.svg" alt="Escudo" style={{ width: 200 }} />
          <h2 style={{ fontFamily: "Georgia", color: "#1e3a8a", fontSize: 40 }}>HISPANIA IMPERIAL</h2>
          <p>PLUS ULTRA</p>
          {!user && <button onClick={login} style={btnPrimary}>🔐 Iniciar sesión</button>}
        </div>
      )}

      {/* ARTÍCULOS */}
      {view === "articles" && (
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          {CATEGORIES.map(cat => {
            const catArts = articles.filter(a => a.category === cat);
            if (!catArts.length) return null;
            return (
              <div key={cat} style={{ marginBottom: 15 }}>
                <div className={`accordion-header ${openCategories.includes(cat) ? 'active' : ''}`} onClick={() => toggleCategory(cat)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className={`accordion-icon ${openCategories.includes(cat) ? 'open' : ''}`}>▶</span>
                    <span style={{ fontWeight: "bold", fontSize: 18 }}>{cat}</span>
                    <span style={{ background: "#cbd5e1", borderRadius: 20, padding: "2px 8px", fontSize: 12 }}>{catArts.length}</span>
                  </div>
                  {catArts.some(isNew) && <span className="badge-new">🆕</span>}
                </div>
                <div className={`accordion-content ${openCategories.includes(cat) ? '' : 'closed'}`}>
                  {catArts.map(a => (
                    <div key={a.id} style={{ background: "#fff", padding: 20, margin: "10px 0", borderRadius: 10, boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
                      <h3 style={{ margin: 0, fontFamily: "Georgia" }}>{a.title} {isNew(a) && <span className="badge-new">✨ NUEVO</span>}</h3>
                      <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6, color: "#334155" }}>{a.content}</p>
                      {a.image && <img src={a.image} style={{ maxWidth: "100%", marginTop: 10, borderRadius: 8 }} alt={a.title} />}
                      
                      <div className="article-actions" style={{ marginTop: 15 }}>
                         {user && (role === "owner" || role === "admin" || (role === "editor" && a.authorId === user.uid)) && (
                           <>
                             <button onClick={() => startEdit(a)} style={btnPrimary}>✏️ Editar</button>
                             <button onClick={() => removeArticle(a.id)} style={btnDanger}>🗑️ Eliminar</button>
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

      {/* ENLACES (VISTA PÚBLICA) */}
      {view === "links" && (
        <div style={{ maxWidth: 800, margin: "40px auto" }}>
          <h2 style={{ fontFamily: "Georgia" }}>🔗 Enlaces de interés</h2>
          <div style={{ display: "grid", gap: 15 }}>
            {links.map(link => (
              <a key={link.id} href={link.url} target="_blank" style={{ padding: 15, background: "#fff", borderRadius: 10, fontWeight: "bold", textDecoration: "none", color: "#1e3a8a" }}>
                🔗 {link.name}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ⚙️ ADMINISTRACIÓN (COMPLETA) */}
      {view === "admin" && (role === "owner" || role === "admin") && (
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          
          {/* USER INFO */}
          <div style={{ background: "#fff", padding: 15, borderRadius: 10, marginBottom: 20, textAlign: "center" }}>
            <p>👤 {user?.email} | 🔑 {role}</p>
            <button onClick={logout} style={btnDanger}>🚪 Cerrar sesión</button>
          </div>

          {/* IMPORTADOR */}
          <div style={{ background: "#fff", padding: 25, borderRadius: 12, marginBottom: 30, border: "1px solid #e2e8f0" }}>
            <h2 style={{ marginTop: 0, borderBottom: "2px solid #fbbf24", paddingBottom: 10 }}>📂 Importar Contenido</h2>
            <p style={{ color: "#64748b", marginBottom: 15 }}>Sube un archivo <strong>.docx</strong> o <strong>.txt</strong> para extraer su texto.</p>
            <label className="import-zone">
              <div style={{ fontSize: 40, marginBottom: 10 }}>📄</div>
              <p style={{ fontWeight: "bold", margin: 0 }}>Haz clic para seleccionar archivo</p>
              <input type="file" accept=".docx,.txt" onChange={handleFileImport} style={{ display: 'none' }} />
            </label>
            {isImporting && <p style={{ textAlign: "center", color: "#1d4ed8", marginTop: 10 }}>⏳ Procesando...</p>}
            {importError && <p style={{ textAlign: "center", color: "#b91c1c", marginTop: 10 }}>{importError}</p>}
          </div>

          {/* EDITOR */}
          <div style={{ background: "#fff", padding: 25, borderRadius: 12, marginBottom: 30 }}>
            <h2 style={{ marginTop: 0 }}>{editingId ? "✏️ Editar Artículo" : "🚀 Publicar Artículo"}</h2>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título" style={{ width: "100%", marginBottom: 10, padding: 12, borderRadius: 8, border: "1px solid #cbd5e1" }} />
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Contenido (se rellena al importar)" style={{ width: "100%", marginBottom: 10, padding: 12, borderRadius: 8, border: "1px solid #cbd5e1", minHeight: 200 }} />
            <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: "100%", padding: 12, marginBottom: 10, borderRadius: 8, border: "1px solid #cbd5e1" }}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <input value={image} onChange={e => setImage(e.target.value)} placeholder="URL de Imagen (Cloudinary)" style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #cbd5e1" }} />
            <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
              <button onClick={publish} style={btnPrimary}>{editingId ? "💾 Guardar" : "🚀 Publicar"}</button>
              {editingId && <button onClick={() => { setEditingId(null); setTitle(""); setContent(""); }} style={btnDanger}>Cancelar</button>}
            </div>
          </div>

          {/* GESTIÓN USUARIOS */}
          <div style={{ background: "#fff", padding: 20, borderRadius: 12, marginBottom: 30 }}>
            <h3 style={{ marginTop: 0 }}>👥 Gestión de Usuarios</h3>
            <div style={{ display: "flex", gap: 10, marginBottom: 15 }}>
              {role === "owner" && <button onClick={makeAdmin} style={btnPrimary}>➕ Admin</button>}
              <button onClick={makeEditor} style={btnPrimary}>➕ Editor</button>
            </div>
            <div>
              {users.map(u => (
                <div key={u.uid} style={{ padding: 10, borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between" }}>
                  <span>{u.email || u.uid} <small>({u.role})</small></span>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>{u.uid}</span>
                </div>
              ))}
            </div>
          </div>

          {/* GESTIÓN ENLACES */}
          <div style={{ background: "#fff", padding: 20, borderRadius: 12, marginBottom: 30 }}>
            <h3 style={{ marginTop: 0 }}>🔧 Gestión de Enlaces</h3>
            <div style={{ display: "flex", gap: 10, marginBottom: 15 }}>
              <input value={newLinkName} onChange={e => setNewLinkName(e.target.value)} placeholder="Nombre" style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }} />
              <input value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)} placeholder="https://..." style={{ flex: 2, padding: 10, borderRadius: 8, border: "1px solid #cbd5e1" }} />
              <button onClick={addLink} style={btnPrimary}>➕ Añadir</button>
            </div>
            <div>
              {links.map(l => (
                <div key={l.id} style={{ padding: 10, borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>{l.name}</span>
                  <button onClick={() => removeLink(l.id)} style={{ ...btnDanger, padding: "5px 10px", fontSize: 12 }}>❌</button>
                </div>
              ))}
            </div>
          </div>

          {/* REGISTRO DE ACTIVIDAD */}
          <div style={{ background: "#fff", padding: 20, borderRadius: 12 }}>
            <h3 style={{ marginTop: 0 }}>📜 Registro de Actividad</h3>
            <div style={{ maxHeight: 200, overflowY: "auto", background: "#f8fafc", padding: 10, borderRadius: 8 }}>
              {activityLogs.length > 0 ? activityLogs.map(log => (
                <div key={log.id} style={{ padding: 8, borderBottom: "1px solid #e2e8f0", fontSize: 13 }}>
                  <span style={{ fontWeight: "bold", color: "#1e3a8a" }}>[{new Date(log.timestamp).toLocaleString()}]</span>
                  <span style={{ color: "#64748b" }}> {log.userEmail}</span>
                  <span style={{ marginLeft: 8, fontWeight: 600 }}>→ {log.type.toUpperCase()}</span>
                  <p style={{ margin: "4px 0 0 0", color: "#334155" }}>{log.details}</p>
                </div>
              )) : <p style={{ textAlign: "center", color: "#64748b" }}>No hay registros recientes.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}