import { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import mammoth from 'mammoth';
import { btnPrimary, btnDanger } from '../App';

// Estilos de la barra de herramientas del editor
const ToolbarButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    style={{
      padding: "6px 10px",
      background: active ? "#1d4ed8" : "#f1f5f9",
      color: active ? "#fff" : "#1e3a8a",
      border: "1px solid #cbd5e1",
      borderRadius: 4,
      cursor: "pointer",
      fontWeight: active ? "bold" : "normal",
      fontSize: 14
    }}
  >
    {children}
  </button>
);

export default function AdminView({ user, role, users, activityLogs, title, setTitle, content, setContent, image, setImage, category, setCategory, editingId, setEditingId, CATEGORIES, publish, makeAdmin, makeEditor, deleteUserRole, toggleRole, copyUidToClipboard, copiedUid, logout, newLinkName, setNewLinkName, newLinkUrl, setNewLinkUrl, addLink, removeLink, links, isDarkMode }) {
  
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState("");

  // Configuración de TIPTAP
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Escribe el contenido de tu artículo aquí...' })
    ],
    content: content || "",
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    },
    immediatelyRender: false,
    editorProps: {
      attributes: {
        style: `padding: 15px; min-height: 250px; outline: none; font-family: Georgia, serif; line-height: 1.6; color: ${isDarkMode ? '#e2e8f0' : '#334155'}; background: ${isDarkMode ? '#0f172a' : '#fff'};`
      }
    }
  });

  // Sincronizar contenido externo al editor
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || "");
    }
  }, [content, editor]);

  const handleFileImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsImporting(true);
    setImportMessage("⏳ Procesando...");
    try {
      if (file.name.endsWith('.txt')) {
        const text = await file.text();
        if (editor) editor.commands.setContent(text.replace(/\n/g, '<br>'));
        if (!title) setTitle(file.name.replace('.txt', ''));
        setImportMessage("✅ Texto cargado");
      } else if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        if (editor) editor.commands.setContent(result.value);
        if (!title) setTitle(file.name.replace('.docx', ''));
        setImportMessage("✅ Word cargado");
      } else { setImportMessage("⚠️ Solo .docx o .txt"); }
    } catch (err) { setImportMessage("❌ Error"); console.error(err); }
    finally { setIsImporting(false); e.target.value = null; }
  };

  const inputStyle = { 
    width: "100%", padding: "12px", marginBottom: "15px", borderRadius: "8px", 
    border: `1px solid ${isDarkMode ? "#475569" : "#cbd5e1"}`, 
    fontSize: "15px", boxSizing: "border-box",
    background: isDarkMode ? "#0f172a" : "#fff",
    color: isDarkMode ? "#e2e8f0" : "#111"
  };
  
  const cardStyle = { 
    background: isDarkMode ? "#1e293b" : "#ffffff", 
    padding: "25px", borderRadius: "12px", marginBottom: "25px", 
    boxShadow: isDarkMode ? "0 4px 6px rgba(0,0,0,0.3)" : "0 4px 6px rgba(0,0,0,0.1)", 
    border: `1px solid ${isDarkMode ? "#334155" : "#e2e8f0"}` 
  };

  return (
    <div style={{ maxWidth: 900, margin: "30px auto" }}>
      {/* INFO USUARIO */}
      <div style={{ 
        textAlign: "center", background: isDarkMode ? "#1e293b" : "#fff", padding: 15, borderRadius: 10, marginBottom: 20, 
        boxShadow: isDarkMode ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.1)" 
      }}>
        <p style={{ margin: "5px 0", fontWeight: 500 }}>👤 {user?.email}</p>
        <p style={{ margin: "5px 0", color: isDarkMode ? "#60a5fa" : "#1d4ed8" }}>🔑 Rol: <strong>{role}</strong></p>
        <div style={{ margin: "10px 0", padding: 8, background: isDarkMode ? "#0f172a" : "#f1f5f9", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
          <code style={{ fontSize: 11, wordBreak: "break-all" }}>🆔 {user?.uid}</code>
          <button onClick={copyUidToClipboard} style={{ background: copiedUid ? "#22c55e" : "#64748b", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 4, fontSize: 11, cursor: "pointer", fontWeight: 500 }}>{copiedUid ? "✅ Copiado" : "📋 Copiar"}</button>
        </div>
        <button onClick={logout} style={btnDanger}>🚪 Cerrar sesión</button>
      </div>

      {/* IMPORTADOR */}
      <div style={cardStyle}>
        <h2 style={{ color: isDarkMode ? "#fbbf24" : "#020617", background: isDarkMode ? "#334155" : "#e2e8f0", padding: "10px", borderRadius: "8px", display: "inline-block", fontWeight: "900", fontFamily: "Georgia, serif", marginBottom: 15 }}>📂 Importar Contenido</h2>
        <p style={{ color: isDarkMode ? "#94a3b8" : "#64748b", marginBottom: 15, textAlign: "center" }}>Sube un archivo <strong>.docx</strong> o <strong>.txt</strong>. Las negritas y listas se conservarán.</p>
        <label className="import-zone" style={{ background: isDarkMode ? "#0f172a" : "#f8fafc" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📄</div>
          <p style={{ fontWeight: "bold", margin: 0, color: isDarkMode ? "#e2e8f0" : "#0f172a" }}>Haz clic para seleccionar archivo</p>
          <input type="file" accept=".docx,.txt" onChange={handleFileImport} style={{ display: 'none' }} />
        </label>
        {isImporting && <p style={{ textAlign: "center", color: "#60a5fa", marginTop: 10, fontWeight: "bold" }}>⏳ Procesando archivo...</p>}
        {importMessage && !isImporting && <p style={{ textAlign: "center", marginTop: 10, fontWeight: "bold", color: importMessage.includes('✅') ? '#15803d' : '#b91c1c' }}>{importMessage}</p>}
      </div>

      {/* ✍️ EDITOR ENRIQUECIDO */}
      <div style={cardStyle}>
        <h2 style={{ color: isDarkMode ? "#fbbf24" : "#020617", background: isDarkMode ? "#334155" : "#e2e8f0", padding: "10px", borderRadius: "8px", display: "inline-block", fontWeight: "900", fontFamily: "Georgia, serif" }}>✍️ {editingId ? "Editar artículo" : "Crear artículo"}</h2>
        
        <input value={title || ""} onChange={e => setTitle(e.target.value)} placeholder="Título del artículo" style={inputStyle} />
        
        {/* BARRA DE HERRAMIENTAS */}
        {editor && (
          <div style={{ display: "flex", gap: 5, padding: 10, background: isDarkMode ? "#0f172a" : "#f8fafc", borderBottom: `1px solid ${isDarkMode ? "#475569" : "#e2e8f0"}`, borderRadius: "8px 8px 0 0", flexWrap: "wrap" }}>
            <ToolbarButton active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>B</ToolbarButton>
            <ToolbarButton active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>I</ToolbarButton>
            <ToolbarButton active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>U</ToolbarButton>
            <ToolbarButton active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>S</ToolbarButton>
            <ToolbarButton active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>• Lista</ToolbarButton>
            <ToolbarButton active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. Lista</ToolbarButton>
            <ToolbarButton active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>" Cita</ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().clearNodes().run()}>🧹 Limpiar</ToolbarButton>
          </div>
        )}
        
        {/* ÁREA DE EDICIÓN */}
        <div style={{ border: `1px solid ${isDarkMode ? "#475569" : "#cbd5e1"}`, borderRadius: "0 0 8px 8px", background: isDarkMode ? "#0f172a" : "#fff", minHeight: "300px" }}>
           <EditorContent editor={editor} />
        </div>

        <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        
        <input value={image || ""} onChange={e => setImage(e.target.value)} placeholder="URL de Imagen (Cloudinary)" style={inputStyle} />
        {image && <img src={image} style={{ maxWidth: "100%", maxHeight: 150, marginTop: 10, borderRadius: 8, objectFit: "cover" }} alt="Preview" onError={(e) => { e.target.style.display = 'none'; }} />}
        
        <br /><br />
        <button onClick={publish} style={btnPrimary}>{editingId ? "💾 Guardar cambios" : "🚀 Publicar"}</button>
        {editingId && <button onClick={() => { setEditingId(null); setTitle(""); setContent(""); setImage(""); if(editor) editor.commands.clearContent(); }} style={{ ...btnDanger, marginLeft: 10 }}>Cancelar</button>}
      </div>

      {/* GESTIÓN USUARIOS */}
      <div style={cardStyle}>
        <h2 style={{ color: isDarkMode ? "#fbbf24" : "#020617", background: isDarkMode ? "#334155" : "#e2e8f0", padding: "10px", borderRadius: "8px", display: "inline-block", fontWeight: "900", fontFamily: "Georgia, serif" }}>👤 Usuarios del sistema</h2>
        <div style={{ marginTop: 15, display: "flex", gap: 10, flexWrap: "wrap" }}>
          {role === "owner" && <button onClick={makeAdmin} style={btnPrimary}>➕ Admin</button>}
          <button onClick={makeEditor} style={btnPrimary}>➕ Editor</button>
        </div>
        <div style={{ marginTop: 15 }}>
          {users.map(u => (
            <div key={u.uid} style={{ marginBottom: 10, padding: 10, background: isDarkMode ? "#0f172a" : "#f8fafc", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <p style={{ margin: 0, fontWeight: "bold" }}>📧 {u.email || "Sin email"}</p>
                <p style={{ margin: "4px 0 0 0", fontSize: 12, color: isDarkMode ? "#94a3b8" : "#64748b", wordBreak: "break-all" }}>🆔 {u.uid}</p>
                <p style={{ margin: "4px 0 0 0", color: isDarkMode ? "#60a5fa" : "#1d4ed8" }}>🔑 Rol: <strong>{u.role}</strong></p>
              </div>
              <div>
                <button onClick={() => toggleRole(u.uid, u.role)} style={btnPrimary}>🔄 Cambiar rol</button>
                <button onClick={() => deleteUserRole(u.uid)} style={btnDanger}>❌ Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* GESTIÓN ENLACES */}
      <div style={cardStyle}>
        <h2 style={{ color: isDarkMode ? "#fbbf24" : "#020617", background: isDarkMode ? "#334155" : "#e2e8f0", padding: "10px", borderRadius: "8px", display: "inline-block", fontWeight: "900", fontFamily: "Georgia, serif" }}>🔧 Gestionar Enlaces</h2>
        <div style={{ marginTop: 15, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input value={newLinkName} onChange={e => setNewLinkName(e.target.value)} placeholder="Nombre del sitio" style={{ flex: 1, padding: 10, borderRadius: 6, border: "1px solid #cbd5e1" }} />
          <input value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)} placeholder="https://..." style={{ flex: 2, padding: 10, borderRadius: 6, border: "1px solid #cbd5e1" }} />
          <button onClick={addLink} style={btnPrimary}>➕ Añadir</button>
        </div>
        <div style={{ marginTop: 15 }}>
          {links.map(l => (
            <div key={l.id} style={{ marginBottom: 8, padding: 8, background: isDarkMode ? "#0f172a" : "#f8fafc", borderRadius: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 500 }}>{l.name}</span>
              <button onClick={() => removeLink(l.id)} style={{ ...btnDanger, padding: "6px 12px", fontSize: 12 }}>❌</button>
            </div>
          ))}
        </div>
      </div>

      {/* REGISTRO DE ACTIVIDAD */}
      <div style={cardStyle}>
        <h2 style={{ color: isDarkMode ? "#fbbf24" : "#020617", background: isDarkMode ? "#334155" : "#e2e8f0", padding: "10px", borderRadius: "8px", display: "inline-block", fontWeight: "900", fontFamily: "Georgia, serif" }}>📜 Registro de Actividad</h2>
        <div style={{ marginTop: 15, maxHeight: 300, overflowY: "auto", background: isDarkMode ? "#0f172a" : "#f8fafc", padding: 10, borderRadius: 8 }}>
          {activityLogs.length > 0 ? activityLogs.map(log => (
            <div key={log.id} style={{ marginBottom: 8, padding: 8, borderBottom: `1px solid ${isDarkMode ? "#334155" : "#e2e8f0"}`, fontSize: 13 }}>
              <span style={{ fontWeight: "bold", color: isDarkMode ? "#60a5fa" : "#1e3a8a" }}>[{new Date(log.timestamp).toLocaleString()}]</span>
              <span style={{ color: isDarkMode ? "#94a3b8" : "#64748b", marginLeft: 8 }}>{log.userEmail}</span>
              <span style={{ marginLeft: 8 }}>→ <strong>{log.type.replace(/_/g, " ").toUpperCase()}</strong></span>
              <p style={{ margin: "4px 0 0 0", color: isDarkMode ? "#cbd5e1" : "#334155" }}>{log.details}</p>
            </div>
          )) : <p style={{ textAlign: "center", color: isDarkMode ? "#94a3b8" : "#64748b", padding: 20 }}>No hay registros recientes.</p>}
        </div>
      </div>
    </div>
  );
}