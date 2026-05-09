import { useState } from 'react';
import mammoth from 'mammoth';
import { btnPrimary, btnDanger } from '../App';

export default function AdminView({ user, role, users, activityLogs, title, setTitle, content, setContent, image, setImage, category, setCategory, editingId, setEditingId, CATEGORIES, publish, startEdit, removeArticle, makeAdmin, makeEditor, deleteUserRole, toggleRole, copyUidToClipboard, copiedUid, logout, newLinkName, setNewLinkName, newLinkUrl, setNewLinkUrl, addLink, removeLink, links, exportToPDF }) {
  
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState("");

  const handleFileImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsImporting(true);
    setImportMessage("⏳ Procesando...");
    try {
      if (file.name.endsWith('.txt')) {
        const text = await file.text();
        setContent(text);
        if (!title) setTitle(file.name.replace('.txt', ''));
        setImportMessage("✅ Texto cargado");
      } else if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setContent(result.value);
        if (!title) setTitle(file.name.replace('.docx', ''));
        setImportMessage("✅ Word cargado");
      } else { setImportMessage("⚠️ Solo .docx o .txt"); }
    } catch (err) { setImportMessage("❌ Error"); }
    finally { setIsImporting(false); e.target.value = null; }
  };

  const inputStyle = { width: "100%", padding: "12px", marginBottom: "15px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "15px", boxSizing: "border-box" };
  const cardStyle = { background: "#ffffff", padding: "25px", borderRadius: "12px", marginBottom: "25px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0" };

  return (
    <div style={{ maxWidth: 900, margin: "30px auto" }}>
      <div style={{ textAlign: "center", background: "#fff", padding: 15, borderRadius: 10, marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <p style={{ margin: "5px 0", fontWeight: 500 }}>👤 {user?.email}</p>
        <p style={{ margin: "5px 0", color: "#1d4ed8" }}>🔑 Rol: <strong>{role}</strong></p>
        <div style={{ margin: "10px 0", padding: 8, background: "#f1f5f9", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
          <code style={{ fontSize: 11, wordBreak: "break-all" }}>🆔 {user?.uid}</code>
          <button onClick={copyUidToClipboard} style={{ background: copiedUid ? "#22c55e" : "#64748b", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 4, fontSize: 11, cursor: "pointer", fontWeight: 500 }}>{copiedUid ? "✅ Copiado" : "📋 Copiar"}</button>
        </div>
        <button onClick={logout} style={btnDanger}>🚪 Cerrar sesión</button>
      </div>

      {/* IMPORTADOR */}
      <div style={cardStyle}>
        <h2 style={{ color: "#020617", background: "#e2e8f0", padding: "10px", borderRadius: "8px", display: "inline-block", fontWeight: "900", fontFamily: "Georgia, serif", marginBottom: 15 }}>📂 Importar Contenido</h2>
        <p style={{ color: "#64748b", marginBottom: 15, textAlign: "center" }}>Sube un archivo <strong>.docx</strong> o <strong>.txt</strong> para extraer su texto automáticamente.</p>
        <label className="import-zone">
          <div style={{ fontSize: 40, marginBottom: 10 }}>📄</div>
          <p style={{ fontWeight: "bold", margin: 0, color: "#0f172a" }}>Haz clic para seleccionar archivo</p>
          <input type="file" accept=".docx,.txt" onChange={handleFileImport} style={{ display: 'none' }} />
        </label>
        {isImporting && <p style={{ textAlign: "center", color: "#1d4ed8", marginTop: 10, fontWeight: "bold" }}>⏳ Procesando archivo...</p>}
        {importMessage && !isImporting && <p style={{ textAlign: "center", marginTop: 10, fontWeight: "bold", color: importMessage.includes('✅') ? '#15803d' : '#b91c1c' }}>{importMessage}</p>}
      </div>

      {/* EDITOR */}
      <div style={cardStyle}>
        <h2 style={{ color: "#020617", background: "#e2e8f0", padding: "10px", borderRadius: "8px", display: "inline-block", fontWeight: "900", fontFamily: "Georgia, serif" }}>✍️ {editingId ? "Editar artículo" : "Crear artículo"}</h2>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título" style={inputStyle} />
        <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Contenido" style={{...inputStyle, minHeight: 120}} />
        <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <input value={image} onChange={e => setImage(e.target.value)} placeholder="URL de Cloudinary" style={inputStyle} />
        {image && <img src={image} style={{ maxWidth: "100%", maxHeight: 150, marginTop: 10, borderRadius: 8, objectFit: "cover" }} alt="Preview" onError={(e) => { e.target.style.display = 'none'; }} />}
        <br /><br />
        <button onClick={publish} style={btnPrimary}>{editingId ? "💾 Guardar cambios" : "🚀 Publicar"}</button>
        {editingId && <button onClick={() => { setEditingId(null); setTitle(""); setContent(""); setImage(""); }} style={{ ...btnDanger, marginLeft: 10 }}>Cancelar</button>}
      </div>

      {/* USUARIOS */}
      <div style={cardStyle}>
        <h2 style={{ color: "#020617", background: "#e2e8f0", padding: "10px", borderRadius: "8px", display: "inline-block", fontWeight: "900", fontFamily: "Georgia, serif" }}>👤 Usuarios del sistema</h2>
        <div style={{ marginTop: 15, display: "flex", gap: 10, flexWrap: "wrap" }}>
          {role === "owner" && <button onClick={makeAdmin} style={btnPrimary}>➕ Admin</button>}
          <button onClick={makeEditor} style={btnPrimary}>➕ Editor</button>
        </div>
        <div style={{ marginTop: 15 }}>
          {users.map(u => (
            <div key={u.uid} style={{ marginBottom: 10, padding: 10, background: "#f8fafc", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <p style={{ margin: 0, fontWeight: "bold" }}>📧 {u.email || "Sin email"}</p>
                <p style={{ margin: "4px 0 0 0", fontSize: 12, color: "#64748b", wordBreak: "break-all" }}>🆔 {u.uid}</p>
                <p style={{ margin: "4px 0 0 0", color: "#1d4ed8" }}>🔑 Rol: <strong>{u.role}</strong></p>
              </div>
              <div>
                <button onClick={() => toggleRole(u.uid, u.role)} style={btnPrimary}>🔄 Cambiar rol</button>
                <button onClick={() => deleteUserRole(u.uid)} style={btnDanger}>❌ Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ENLACES */}
      <div style={cardStyle}>
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

      {/* LOGS */}
      <div style={cardStyle}>
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
  );
}