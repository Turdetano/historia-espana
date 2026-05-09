import { useState, useMemo } from 'react';
import { btnPrimary, btnDanger, btnPDF, styles } from '../App'; // Importamos estilos compartidos

// Componente interno para la tarjeta de artículo
function ArticleCard({ a, user, role, startEdit, removeArticle, sendToTelegram, exportToPDF, isNew }) {
  return (
    <div style={{ background: "#fff", padding: 15, marginBottom: 15, borderRadius: 10, borderLeft: "4px solid #e2e8f0" }}>
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <h3 style={{ margin: 0, fontFamily: "Georgia, serif", color: "#020617" }}>{a.title}</h3>
        {isNew(a) && <span className="badge-new">✨ NUEVO</span>}
      </div>
      <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.5, marginTop: 10 }}>{a.content}</p>
      {a.image && <img src={a.image} style={{ maxWidth: "100%", marginTop: 10, borderRadius: 8 }} alt={a.title} onError={(e) => { e.target.style.display = 'none'; }} />}
      
      {user && ((role === "owner" || role === "admin" || (role === "editor" && a.authorId === user.uid))) && (
        <div className="article-actions" style={{ marginTop: 10 }}>
          <button onClick={() => startEdit(a)} style={btnPrimary}>✏️ Editar</button>
          <button onClick={() => removeArticle(a.id)} style={btnDanger}>🗑️ Eliminar</button>
          <button onClick={() => sendToTelegram(a)} style={{ ...btnPrimary, background: "#22c55e" }}>📤 Telegram</button>
        </div>
      )}
      <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed #e2e8f0" }}>
        <button onClick={() => exportToPDF(a)} style={btnPDF}>📥 Descargar como PDF</button>
      </div>
    </div>
  );
}

export default function ArticlesView({ articles, user, role, startEdit, removeArticle, sendToTelegram, exportToPDF, isNew }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchCategory, setSearchCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [openCategories, setOpenCategories] = useState(["Edad Antigua"]);

  const CATEGORIES = ["Edad Antigua", "Edad Media", "Reconquista", "Imperio Español", "Edad Contemporánea"];

  // Lógica del Buscador
  const filteredAndSortedArticles = useMemo(() => {
    let result = [...articles];
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(a => a.title.toLowerCase().includes(term) || a.content.toLowerCase().includes(term));
    }
    if (searchCategory !== "all") {
      result = result.filter(a => a.category === searchCategory);
    }
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.date);
      const dateB = new Date(b.createdAt || b.date);
      return sortBy === "newest" ? dateB - dateA : dateA - dateB;
    });
    return result;
  }, [articles, searchTerm, searchCategory, sortBy]);

  const articlesByCategory = useMemo(() => {
    const grouped = {};
    CATEGORIES.forEach(cat => { grouped[cat] = filteredAndSortedArticles.filter(a => a.category === cat); });
    return grouped;
  }, [filteredAndSortedArticles]);

  const toggleCategory = (cat) => {
    setOpenCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const clearFilters = () => { setSearchTerm(""); setSearchCategory("all"); setSortBy("newest"); };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      {/* 🔍 BARRA DE BÚSQUEDA */}
      <div className="search-bar">
        <input type="text" className="search-input" placeholder="🔍 Buscar por título o contenido..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <div className="search-filters">
          <select className="search-select" value={searchCategory} onChange={(e) => setSearchCategory(e.target.value)}>
            <option value="all">📚 Todas las épocas</option>
            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <select className="search-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">📅 Más recientes</option>
            <option value="oldest">📅 Más antiguos</option>
          </select>
          {(searchTerm || searchCategory !== "all" || sortBy !== "newest") && (
            <button onClick={clearFilters} style={{...btnPrimary, background: "#fff", color: "#1e3a8a", border: "2px solid #1d4ed8", padding: "10px 16px"}}>🧹 Limpiar</button>
          )}
        </div>
        <div className="search-results-info">
          {filteredAndSortedArticles.length} resultado{filteredAndSortedArticles.length !== 1 ? 's' : ''} encontrado{filteredAndSortedArticles.length !== 1 ? 's' : ''}
          {searchTerm && <span> para "{searchTerm}"</span>}
        </div>
      </div>

      {/* LISTA DE ARTÍCULOS */}
      {CATEGORIES.map(cat => {
        const catArticles = articlesByCategory[cat];
        if (catArticles.length === 0) return null;
        const isOpen = openCategories.includes(cat);
        const hasNew = catArticles.some(isNew);

        return (
          <div key={cat} style={{ marginBottom: 15 }}>
            <div className={`accordion-header ${isOpen ? 'active' : ''}`} onClick={() => toggleCategory(cat)}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className={`accordion-icon ${isOpen ? 'open' : ''}`}>▶</span>
                <h2 style={{ margin: 0, fontSize: "18px", color: "#1d4ed8" }}>📚 {cat}</h2>
                <span style={{ background: "#cbd5e1", borderRadius: 50, padding: "2px 8px", fontSize: 12, fontWeight: "bold" }}>{catArticles.length}</span>
              </div>
              {hasNew && <span className="badge-new">🆕 NUEVO</span>}
            </div>
            <div className={`accordion-content ${isOpen ? '' : 'closed'}`}>
              {catArticles.map(a => (
                <ArticleCard key={a.id} a={a} user={user} role={role} startEdit={startEdit} removeArticle={removeArticle} sendToTelegram={sendToTelegram} exportToPDF={exportToPDF} isNew={isNew} />
              ))}
            </div>
          </div>
        );
      })}

      {filteredAndSortedArticles.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, background: "#fff", borderRadius: 12, border: "2px dashed #cbd5e1" }}>
          <p style={{ fontSize: 40, marginBottom: 10 }}>🔍</p>
          <p style={{ fontWeight: "bold", color: "#1e3a8a", marginBottom: 5 }}>No se encontraron artículos</p>
          <button onClick={clearFilters} style={btnPrimary}>🧹 Limpiar búsqueda</button>
        </div>
      )}
    </div>
  );
}