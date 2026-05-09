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

// Importamos las Subcontratas (Componentes)
import HomeView from "./components/HomeView";
import ArticlesView from "./components/ArticlesView";
import LinksView from "./components/LinksView";
import AdminView from "./components/AdminView";

// ==============================
// ⚙️ CONFIGURACIÓN
// ==============================

const provider = new GoogleAuthProvider();
const ADMIN_UID = "PVBWPZUwVwZnwAnaA5F0a6UuqF83";
const CATEGORIES = ["Edad Antigua", "Edad Media", "Reconquista", "Imperio Español", "Edad Contemporánea"];

// Estilos Globales
export const btnPrimary = { background: "#1d4ed8", color: "#fff", padding: "14px 20px", borderRadius: 10, border: "none", cursor: "pointer", marginRight: 10, fontWeight: "bold", fontSize: "16px", minHeight: "48px", touchAction: "manipulation" };
export const btnDanger = { background: "#b91c1c", color: "#fff", padding: "14px 20px", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "16px", minHeight: "48px", touchAction: "manipulation" };
export const btnPDF = { background: "#0f172a", color: "#fff", padding: "10px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: "600", fontSize: "14px", width: "100%", marginTop: 10, touchAction: "manipulation" };

export const styles = `
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  button { transition: transform 0.1s, opacity 0.2s; }
  button:active { transform: scale(0.98); opacity: 0.9; }
  .badge-new { display: inline-block; background: linear-gradient(135deg, #fbbf24, #d97706); color: #fff; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; margin-left: 8px; vertical-align: middle; box-shadow: 0 2px 4px rgba(0,0,0,0.2); animation: pulse 2s infinite; }
  @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.8; } 100% { opacity: 1; } }
  .accordion-header { background: #e2e8f0; padding: 15px; border-radius: 10px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; transition: background 0.2s; border-left: 5px solid #1d4ed8; }
  .accordion-header:hover { background: #cbd5e1; }
  .accordion-header.active { border-left: 5px solid #fbbf24; background: #fff; }
  .accordion-icon { font-size: 20px; transition: transform 0.3s; }
  .accordion-icon.open { transform: rotate(180deg); }
  .accordion-content { max-height: 2000px; overflow: hidden; transition: max-height 0.4s ease-out, opacity 0.4s ease-out; opacity: 1; }
  .accordion-content.closed { max-height: 0; opacity: 0; pointer-events: none; }
  .import-zone { border: 2px dashed #94a3b8; border-radius: 12px; padding: 25px; text-align: center; background: #f8fafc; margin-bottom: 25px; cursor: pointer; transition: all 0.2s; }
  .import-zone:hover { border-color: #1d4ed8; background: #eff6ff; }
  .search-bar { background: #fff; padding: 20px; border-radius: 12px; margin-bottom: 25px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
  .search-input { width: 100%; padding: 12px 16px; border: 2px solid #cbd5e1; border-radius: 8px; font-size: 16px; margin-bottom: 15px; transition: border-color 0.2s; }
  .search-input:focus { outline: none; border-color: #1d4ed8; }
  .search-filters { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
    .search-select { padding: 10px 14px; border: 2px solid #cbd5e1; border-radius: 8px; font-size: 14px; background: #fff; cursor: pointer; color: #0f172a; }
  .search-select:focus { outline: none; border-color: #1d4ed8; }
  .search-results-info { font-size: 14px; color: #64748b; margin-top: 10px; font-style: italic; }
  @media (max-width: 640px) { .nav-buttons { display: flex; flex-direction: column; gap: 10px; align-items: stretch; } .nav-buttons button { width: 100%; margin: 0; padding: 16px 20px; font-size: 16px; } .article-actions { display: flex; flex-direction: column; gap: 8px; } .article-actions button { width: 100%; margin: 0; padding: 14px 16px; } .user-uid-box { flex-direction: column !important; gap: 8px !important; } .user-card { flex-direction: column !important; align-items: stretch !important; gap: 12px !important; } .user-card-actions { display: flex; flex-direction: column; gap: 8px; } .user-card-actions button { width: 100%; } .search-filters { flex-direction: column; align-items: stretch; } .search-select { width: 100%; } h1 { font-size: 28px !important; } h2 { font-size: 22px !important; } input, textarea, select { font-size: 16px !important; } }
  @media (min-width: 1025px) { .nav-buttons { display: flex; flex-direction: row; justify-content: center; gap: 0; } .nav-buttons button { margin-right: 10px; } }
`;

// ==============================
// 🚀 TRACTOR PRINCIPAL
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

  // --- AUTH & ROLES ---
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
              await setDoc(uidRef, { role: userRole, email: u.email, migratedAt: new Date().toISOString() });
              await deleteDoc(doc(db, "roles", u.email));
            }
          }
          if (!userRole) {
            await setDoc(uidRef, { role: "lector", email: u.email, createdAt: new Date().toISOString() });
            userRole = "lector";
            if (!localStorage.getItem('welcomed_' + u.uid)) { alert("👋 Bienvenido. Cuenta creada como LECTOR."); localStorage.setItem('welcomed_' + u.uid, 'true'); }
          }
          setRole(userRole);
        } catch (err) { setRole("lector"); }
      } else { setRole(null); }
    });
    return () => unsubscribe();
  }, []);

  // --- CARGA DE DATOS ---
  useEffect(() => {
    const loadData = async () => {
      const load = async (col, setter) => { const snap = await getDocs(collection(db, col)); setter(snap.docs.map(d => ({ id: d.id, ...d.data() }))); };
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

  // --- FUNCIONES TRACTOR ---
  const login = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);
  const checkAuth = () => { if (!user) { alert("🔒 Inicia sesión"); return false; } return true; };
  
  const logActivity = async (type, details) => {
    try { await addDoc(collection(db, "activity_log"), { type, details, userEmail: user?.email || "Sistema", userId: user?.uid || "Sistema", timestamp: new Date().toISOString() }); } catch (err) {}
  };

  const copyUidToClipboard = () => {
    if (user?.uid) { navigator.clipboard.writeText(user.uid); setCopiedUid(true); setTimeout(() => setCopiedUid(false), 2000); }
  };

  const makeAdmin = async () => { if (role !== "owner") return; const t = prompt("UID o Email:"); if (!t) return; await setDoc(doc(db, "roles", t), { role: "admin" }); logActivity("admin_asignado", t); alert("✅"); };
  const makeEditor = async () => { if (role !== "owner" && role !== "admin") return; const t = prompt("UID o Email:"); if (!t) return; await setDoc(doc(db, "roles", t), { role: "editor" }); logActivity("editor_asignado", t); alert("✅"); };
  const deleteUserRole = async (uid) => { if (uid === ADMIN_UID) return; if (!confirm("¿Eliminar?")) return; await deleteDoc(doc(db, "roles", uid)); logActivity("usuario_eliminado", uid); };
  const toggleRole = async (uid, currentRole) => { if (uid === ADMIN_UID) return; const newRole = currentRole === "admin" ? "editor" : "admin"; await setDoc(doc(db, "roles", uid), { role: newRole }); logActivity("rol_cambiado", `${uid} -> ${newRole}`); };

  const publish = async () => {
    if (!checkAuth()) return;
    if (!title || !content) return alert("❌ Rellena título y contenido");
    const data = { title, content, category, image: image || "", date: new Date().toLocaleDateString(), author: user.email, authorId: user.uid, updatedAt: new Date().toISOString(), createdAt: editingId ? undefined : new Date().toISOString() };
    if (editingId) await updateDoc(doc(db, "articles", editingId), data);
    else await addDoc(collection(db, "articles"), data);
    logActivity(editingId ? "actualizado" : "creado", `"${title}"`);
    const snap = await getDocs(collection(db, "articles"));
    setArticles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setTitle(""); setContent(""); setImage(""); setEditingId(null);
  };

  const startEdit = (a) => { if (!checkAuth()) return; if (role === "editor" && a.authorId !== user.uid) return alert("❌ Solo tus artículos"); setTitle(a.title); setContent(a.content); setCategory(a.category); setImage(a.image || ""); setEditingId(a.id); setView("admin"); };
  const removeArticle = async (id) => { if (!checkAuth()) return; if (!confirm("¿Eliminar?")) return; await deleteDoc(doc(db, "articles", id)); logActivity("articulo_eliminado", id); const snap = await getDocs(collection(db, "articles")); setArticles(snap.docs.map(d => ({ id: d.id, ...d.data() }))); };

  const addLink = async () => { if (!newLinkName || !newLinkUrl) return alert("❌ Completa campos"); await addDoc(collection(db, "links"), { name: newLinkName, url: newLinkUrl }); logActivity("enlace_creado", newLinkName); const snap = await getDocs(collection(db, "links")); setLinks(snap.docs.map(d => ({ id: d.id, ...d.data() }))); };
  const removeLink = async (id) => { await deleteDoc(doc(db, "links", id)); const snap = await getDocs(collection(db, "links")); setLinks(snap.docs.map(d => ({ id: d.id, ...d.data() }))); };

  const sendToTelegram = async (a) => {
    if (!checkAuth()) return;
    const lastSend = localStorage.getItem(`tg_cooldown_${user.uid}`);
    if (lastSend && (Date.now() - parseInt(lastSend)) < 300000) return alert(`⏳ Espera ${Math.ceil((300000 - (Date.now() - parseInt(lastSend))) / 1000)}s`);
    if (!confirm("¿Enviar a Telegram?")) return;
    const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
    const CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;
    if (!BOT_TOKEN || !CHAT_ID) return alert("⚠️ Credenciales Telegram faltantes");
    const safeTitle = a.title.replace(/[*_`~[\]\\]/g, "");
    const safeContent = a.content.replace(/[*_`~[\]\\]/g, "");
    const header = `📜 *${safeTitle}*\n📚 ${a.category}\n\n`;
    try {
      if (a.image) await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: CHAT_ID, photo: a.image, caption: header, parse_mode: "Markdown" }) });
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: CHAT_ID, text: header + safeContent, parse_mode: "Markdown" }) });
      localStorage.setItem(`tg_cooldown_${user.uid}`, Date.now().toString());
      logActivity("telegram_enviado", `"${a.title}"`);
      alert("✅ Enviado");
    } catch (err) { alert("❌ Error"); }
  };

  const exportToPDF = async (a) => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');
      const temp = document.createElement('div');
      temp.innerHTML = `<h1 style="color:#1e3a8a">🏛️ HISPANIA IMPERIAL</h1><h2>${a.title}</h2><p>${a.content}</p><hr><small>Generado desde Hispania Imperial</small>`;
      document.body.appendChild(temp);
      const canvas = await html2canvas(temp);
      const pdf = new jsPDF();
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 10, 190, 0);
      pdf.save(`${a.title}.pdf`);
      document.body.removeChild(temp);
      logActivity('pdf_descargado', `"${a.title}"`);
    } catch (e) { alert("❌ Error PDF"); }
  };

  const isNew = (a) => a.createdAt && (new Date() - new Date(a.createdAt) < 7 * 24 * 60 * 60 * 1000);

  // --- RENDER UI ---
  return (
    <div style={{ background: "#f1f5f9", minHeight: "100vh", padding: 20, fontFamily: "Segoe UI, Arial", color: "#111" }}>
      <style>{styles}</style>
      
      <h1 style={{ textAlign: "center", fontSize: "36px", fontWeight: "900", color: "#020617", fontFamily: "Georgia, serif" }}>📜 Historia de España</h1>

      {/* NAV */}
      <div className="nav-buttons" style={{ textAlign: "center", marginBottom: 20 }}>
        <button onClick={() => setView("home")} style={btnPrimary}>🏠 Inicio</button>
        <button onClick={() => setView("articles")} style={btnPrimary}>📚 Artículos</button>
        <button onClick={() => setView("links")} style={btnPrimary}>🔗 Enlaces</button>
        {(role === "owner" || role === "admin") && <button onClick={() => setView("admin")} style={btnDanger}>⚙️ Admin</button>}
      </div>

      {/* VISTAS */}
      {view === "home" && <HomeView login={login} setView={setView} user={user} />}
      
      {view === "articles" && (
        <ArticlesView 
          articles={articles} user={user} role={role} 
          startEdit={startEdit} removeArticle={removeArticle} 
          sendToTelegram={sendToTelegram} exportToPDF={exportToPDF} isNew={isNew} 
        />
      )}
      
      {view === "links" && <LinksView links={links} />}
      
      {view === "admin" && (role === "owner" || role === "admin") && (
        <AdminView 
          user={user} role={role} users={users} activityLogs={activityLogs}
          title={title} setTitle={setTitle} content={content} setContent={setContent}
          image={image} setImage={setImage} category={category} setCategory={setCategory}
          editingId={editingId} setEditingId={setEditingId} CATEGORIES={CATEGORIES}
          publish={publish} makeAdmin={makeAdmin} makeEditor={makeEditor} deleteUserRole={deleteUserRole} toggleRole={toggleRole}
          copyUidToClipboard={copyUidToClipboard} copiedUid={copiedUid} logout={logout}
          newLinkName={newLinkName} setNewLinkName={setNewLinkName} newLinkUrl={newLinkUrl} setNewLinkUrl={setNewLinkUrl}
          addLink={addLink} removeLink={removeLink} links={links}
        />
      )}
    </div>
  );
}