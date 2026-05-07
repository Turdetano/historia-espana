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
import mammoth from "mammoth"; // 🆕 Librería Importadora

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
// 🎨 ESTILOS GLOBALES
// ==============================

const btnPrimary = {
  background: "#1d4ed8", color: "#fff", padding: "12px 18px", borderRadius: 8,
  border: "none", cursor: "pointer", marginRight: 10, fontWeight: "bold",
  fontSize: "14px", transition: "all 0.2s"
};

const btnDanger = {
  background: "#b91c1c", color: "#fff", padding: "12px 18px", borderRadius: 8,
  border: "none", cursor: "pointer", fontWeight: "bold",
  fontSize: "14px", transition: "all 0.2s"
};

const btnSuccess = {
  background: "#15803d", color: "#fff", padding: "12px 18px", borderRadius: 8,
  border: "none", cursor: "pointer", fontWeight: "bold",
  fontSize: "14px", transition: "all 0.2s"
};

const cardStyle = {
  background: "#ffffff",
  padding: "25px",
  borderRadius: "12px",
  marginBottom: "25px",
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  border: "1px solid #e2e8f0"
};

const inputStyle = {
  width: "100%", padding: "12px", marginBottom: "15px", borderRadius: "8px",
  border: "1px solid #cbd5e1", fontSize: "15px", boxSizing: "border-box"
};

// Estilos CSS para Accordion y Badges
const cssStyles = `
  .badge-new {
    display: inline-block; background: linear-gradient(135deg, #fbbf24, #d97706);
    color: #fff; padding: 2px 8px; border-radius: 12px; font-size: 11px;
    font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;
    margin-left: 8px; vertical-align: middle;
  }
  .accordion-header {
    background: #f1f5f9; padding: 15px; border-radius: 10px; cursor: pointer;
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 10px; border-left: 5px solid #1d4ed8; transition: background 0.2s;
  }
  .accordion-header:hover { background: #e2e8f0; }
  .accordion-header.active { border-left: 5px solid #fbbf24; background: #fff; }
  .accordion-icon { font-size: 18px; transition: transform 0.3s; }
  .accordion-icon.open { transform: rotate(90deg); }
  .accordion-content {
    max-height: 2000px; overflow: hidden; transition: max-height 0.4s ease-out, opacity 0.4s; opacity: 1;
  }
  .accordion-content.closed { max-height: 0; opacity: 0; pointer-events: none; }
  
  /* Import Zone */
  .import-zone {
    border: 2px dashed #94a3b8; border-radius: 12px; padding: 30px;
    text-align: center; background: #f8fafc; transition: all 0.2s; cursor: pointer;
  }
  .import-zone:hover { border-color: #1d4ed8; background: #eff6ff; }
`;

// ==============================
// 🚀 APP COMPONENT
// ==============================

export default function App() {
  // --- ESTADOS ---
  const [articles, setArticles] = useState([]);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [users, setUsers] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  
  // Formulario
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [editingId, setEditingId] = useState(null);
  
  // UI
  const [view, setView] = useState("home");
  const [links, setLinks] = useState([]);
  const [newLinkName, setNewLinkName] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [openCategories, setOpenCategories] = useState(["Edad Antigua"]);
  
  // Importación
  const [isImporting, setIsImporting] = useState(false);
  const [importMsg, setImportMsg] = useState({ text: "", type: "" });

  // --- FIREBASE & AUTH ---
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
            alert("👋 Bienvenido. Cuenta creada como LECTOR.");
          }
          setRole(userRole);
        } catch (err) { setRole("lector"); }
      } else { setRole(null); }
    });
    return () => unsubscribe();
  }, []);

  // --- CARGA DE DATOS ---
  useEffect(() => {
    const load = async (col, setter) => {
      const snap = await getDocs(collection(db, col));
      setter(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    load("roles", setUsers);
    load("articles", setArticles);
    load("links", setLinks);
    
    // Logs (Solo admin)
    if (role === "owner" || role === "admin") {
      const logSnap = await getDocs(collection(db, "activity_log"));
      const logs = logSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setActivityLogs(logs.slice(0, 50));
    }
  }, [role]);

  // --- FUNCIONES AUXILIARES ---
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

  // --- IMPORTADOR (WORD/TXT) ---
  const handleFileImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsImporting(true);
    setImportMsg({ text: "⏳ Procesando...", type: "info" });

    try {
      if (file.name.endsWith('.txt')) {
        const text = await file.text();
        setContent(text);
        if (!title) setTitle(file.name.replace('.txt', ''));
        setImportMsg({ text: "✅ Texto cargado", type: "success" });
      } else if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setContent(result.value);
        if (!title) setTitle(file.name.replace('.docx', ''));
        setImportMsg({ text: "✅ Documento Word cargado", type: "success" });
      } else {
        setImportMsg({ text: "⚠️ Solo .docx o .txt", type: "error" });
      }
    } catch (err) {
      setImportMsg({ text: "❌ Error al leer", type: "error" });
    } finally {
      setIsImporting(false);
      e.target.value = null;
    }
  };

  // --- CRUD ARTÍCULOS ---
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
    alert("✅ Artículo guardado");
  };

  const removeArticle = async (id) => {
    if (!confirm("¿Eliminar?")) return;
    await deleteDoc(doc(db, "articles", id));
    const snap = await getDocs(collection(db, "articles"));
    setArticles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  // --- ROLES ---
  const makeAdmin = async () => {
    const t = prompt("UID o Email:");
    if (!t) return;
    await setDoc(doc(db, "roles", t), { role: "admin" });
    alert("✅ Admin asignado");
  };
  const makeEditor = async () => {
    const t = prompt("UID o Email:");
    if (!t) return;
    await setDoc(doc(db, "roles", t), { role: "editor" });
    alert("✅ Editor asignado");
  };

  // --- ENLACES ---
  const addLink = async () => {
    if (!newLinkName || !newLinkUrl) return alert("Completa los campos");
    await addDoc(collection(db, "links"), { name: newLinkName, url: newLinkUrl });
    const snap = await getDocs(collection(db, "links"));
    setLinks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };
  const removeLink = async (id) => {
    await deleteDoc(doc(db, "links", id));
    const snap = await getDocs(collection(db, "links"));
    setLinks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  // --- PDF EXPORT ---
  const exportToPDF = async (a) => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');
      const temp = document.createElement('div');
      temp.innerHTML = `<h1>${a.title}</h1><pre>${a.content}</pre>`;
      document.body.appendChild(temp);
      const canvas = await html2canvas(temp);
      const pdf = new jsPDF();
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 10, 190, 0);
      pdf.save(`${a.title}.pdf`);
      document.body.removeChild(temp);
    } catch (e) { alert("Error PDF"); }
  };

  // --- TELEGRAM ---
  const sendToTelegram = async (a) => {
    if (!confirm("¿Enviar a Telegram?")) return;
    alert("📤 Función Telegram activa (requiere variables de entorno configuradas)");
    // Aquí iría la lógica de fetch a la API de Telegram
  };

  // ==============================
  // 🎨 RENDER UI
  // ==============================
  return (
    <div style={{ background: "#f1f5f9", minHeight: "100vh", padding: 20, fontFamily: "system-ui, sans-serif", color: "#111" }}>
      <style>{cssStyles}</style>
      
      {/* HEADER */}
      <div style={{ textAlign: "center", marginBottom: 30 }}>
        <h1 style={{ fontSize: "32px", fontWeight: "900", color: "#0f172a" }}>📜 Historia de España</h1>
        <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap", marginTop: 15 }}>
          <button onClick={() => setView("home")} style={btnPrimary}>🏠 Inicio</button>
          <button onClick={() => setView("articles")} style={btnPrimary}>📚 Artículos</button>
          <button onClick={() => setView("links")} style={btnPrimary}>🔗 Enlaces</button>
          {(role === "owner" || role === "admin") && (
            <button onClick={() => setView("admin")} style={btnDanger}>⚙️ Admin</button>
          )}
        </div>
      </div>

      {/* VISTA: INICIO */}
      {view === "home" && (
        <div style={{ textAlign: "center", marginTop: 40 }}>
          <img src="https://upload.wikimedia.org/wikipedia/commons/8/8b/Escudo_de_los_Reyes_Catolicos_%281475-1492%29.svg" alt="Escudo" style={{ width: 180, marginBottom: 20 }} />
          <h2 style={{ fontFamily: "Georgia", fontSize: 36, color: "#1e3a8a", margin: 0 }}>HISPANIA IMPERIAL</h2>
          <p style={{ fontSize: 18, fontStyle: "italic", color: "#64748b" }}>PLUS ULTRA</p>
          {!user && (
            <button onClick={login} style={{ ...btnPrimary, marginTop: 20, padding: "15px 30px", fontSize: 18 }}>🔐 Iniciar Sesión</button>
          )}
        </div>
      )}

      {/* VISTA: ARTÍCULOS */}
      {view === "articles" && (
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          {CATEGORIES.map(cat => {
            const catArts = articles.filter(a => a.category === cat);
            if (!catArts.length) return null;
            return (
              <div key={cat}>
                <div className={`accordion-header ${openCategories.includes(cat) ? 'active' : ''}`} onClick={() => toggleCategory(cat)}>
                  <span style={{ fontWeight: "bold", fontSize: 18 }}>📚 {cat} ({catArts.length})</span>
                  <span className={`accordion-icon ${openCategories.includes(cat) ? 'open' : ''}`}>▶</span>
                </div>
                <div className={`accordion-content ${openCategories.includes(cat) ? '' : 'closed'}`}>
                  {catArts.map(a => (
                    <div key={a.id} style={{ background: "#fff", padding: 20, margin: "10px 0", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                      <h3 style={{ margin: "0 0 10px 0" }}>
                        {a.title} {isNew(a) && <span className="badge-new">NUEVO</span>}
                      </h3>
                      <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6, color: "#334155" }}>{a.content.substring(0, 150)}...</p>
                      <div style={{ marginTop: 15, display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button onClick={() => { setTitle(a.title); setContent(a.content); setCategory(a.category); setImage(a.image); setEditingId(a.id); setView('admin'); }} style={btnPrimary}>✏️ Editar</button>
                        <button onClick={() => removeArticle(a.id)} style={btnDanger}>🗑️ Borrar</button>
                        <button onClick={() => exportToPDF(a)} style={{...btnPrimary, background:"#475569"}}>📥 PDF</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VISTA: ENLACES */}
      {view === "links" && (
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", marginBottom: 20 }}>🔗 Enlaces de Interés</h2>
          {links.map(l => (
            <a key={l.id} href={l.url} target="_blank" style={{ display: "block", background: "#fff", padding: 15, marginBottom: 10, borderRadius: 8, textDecoration: "none", color: "#1d4ed8", fontWeight: "bold", border: "1px solid #e2e8f0" }}>
              🔗 {l.name}
            </a>
          ))}
        </div>
      )}

      {/* VISTA: ADMINISTRACIÓN */}
      {view === "admin" && (role === "owner" || role === "admin") && (
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          
          {/* 1. INFO USUARIO */}
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ margin: 0, fontWeight: "bold" }}>👤 {user?.email}</p>
                <p style={{ margin: 0, color: "#64748b" }}>🔑 Rol: {role}</p>
              </div>
              <button onClick={logout} style={btnDanger}>🚪 Salir</button>
            </div>
          </div>

          {/* 2. IMPORTADOR */}
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0, borderBottom: "2px solid #fbbf24", paddingBottom: 10 }}>📂 Importar Contenido</h2>
            <p style={{ color: "#64748b", marginBottom: 15 }}>Sube un archivo <strong>.docx</strong> o <strong>.txt</strong> para extraer su texto.</p>
            
            <label className="import-zone">
              <div style={{ fontSize: 40, marginBottom: 10 }}>📄</div>
              <p style={{ fontWeight: "bold", margin: 0 }}>Haz clic para seleccionar archivo</p>
              <input type="file" accept=".docx,.txt" onChange={handleFileImport} style={{ display: 'none' }} />
            </label>
            
            {importMsg.text && (
              <p style={{ textAlign: "center", marginTop: 10, fontWeight: "bold", color: importMsg.type === 'error' ? 'red' : 'green' }}>
                {importMsg.text}
              </p>
            )}
          </div>

          {/* 3. EDITOR */}
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>{editingId ? "✏️ Editar Artículo" : "🚀 Publicar Artículo"}</h2>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título del Artículo" style={inputStyle} />
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Contenido (aparece aquí al importar)" style={{ ...inputStyle, minHeight: 150 }} />
            <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <input value={image} onChange={e => setImage(e.target.value)} placeholder="URL de Imagen (Cloudinary)" style={inputStyle} />
            
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={publish} style={btnPrimary}>{editingId ? "💾 Guardar" : "🚀 Publicar"}</button>
              {editingId && <button onClick={() => { setEditingId(null); setTitle(""); setContent(""); }} style={btnDanger}>Cancelar</button>}
            </div>
          </div>

          {/* 4. GESTIÓN USUARIOS */}
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>👥 Gestión de Usuarios</h2>
            <div style={{ display: "flex", gap: 10, marginBottom: 15 }}>
              {role === "owner" && <button onClick={makeAdmin} style={btnPrimary}>➕ Admin</button>}
              <button onClick={makeEditor} style={btnPrimary}>➕ Editor</button>
            </div>
            <div style={{ background: "#f8fafc", padding: 10, borderRadius: 8 }}>
              {users.map(u => (
                <div key={u.uid} style={{ padding: 8, borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between" }}>
                  <span>{u.email || u.uid}</span>
                  <span style={{ fontWeight: "bold", color: "#1d4ed8" }}>{u.role}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 5. GESTIÓN ENLACES */}
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>🔧 Gestión de Enlaces</h2>
            <div style={{ display: "flex", gap: 10, marginBottom: 15 }}>
              <input value={newLinkName} onChange={e => setNewLinkName(e.target.value)} placeholder="Nombre" style={{ ...inputStyle, marginBottom: 0, flex: 1 }} />
              <input value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)} placeholder="https://..." style={{ ...inputStyle, marginBottom: 0, flex: 2 }} />
              <button onClick={addLink} style={btnPrimary}>Añadir</button>
            </div>
            {links.map(l => (
              <div key={l.id} style={{ padding: 8, borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>{l.name}</span>
                <button onClick={() => removeLink(l.id)} style={{ ...btnDanger, padding: "5px 10px", fontSize: 12 }}>❌</button>
              </div>
            ))}
          </div>

          {/* 6. LOGS */}
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>📜 Registro de Actividad</h2>
            <div style={{ maxHeight: 200, overflowY: "auto", background: "#f8fafc", padding: 10, borderRadius: 8 }}>
              {activityLogs.map(log => (
                <div key={log.id} style={{ padding: 5, borderBottom: "1px solid #e2e8f0", fontSize: 13 }}>
                  <span style={{ fontWeight: "bold" }}>{log.type.toUpperCase()}</span>: {log.details}
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}