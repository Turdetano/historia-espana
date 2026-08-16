import { useState, useMemo } from 'react';
import { btnPrimary, btnDanger, btnPDF } from '../App'; 
import CinematicCard from './CinematicCard';
import CinematicParticles from './CinematicParticles';

// Componente para la tarjeta de artículo en la lista
function ArticleCard({ a, isNew, isDarkMode, onOpen }) {
  return (
    <div style={{ 
      background: isDarkMode ? "#1e293b" : "#fff", 
      padding: 15, 
      marginBottom: 15, 
      borderRadius: 10, 
      borderLeft: `4px solid ${isDarkMode ? "#475569" : "#e2e8f0"}` 
    }}>
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <h3 style={{ margin: 0, fontFamily: "Georgia, serif", color: isDarkMode ? "#f1f5f9" : "#020617" }}>{a.title}</h3>
        {isNew(a) && <span className="badge-new">✨ NUEVO</span>}
      </div>
      
      <button 
        onClick={() => onOpen(a)}
        style={{...btnPrimary, width: "100%", marginTop: 10}}
      >
        📖 Leer artículo completo
      </button>
    </div>
  );
}

// Componente para vista individual del artículo
function ArticleFullView({ article, user, role, startEdit, removeArticle, sendToTelegram, exportToPDF, isNew, isDarkMode, onBack }) {
  // Extraemos texto plano para la descripción (sin etiquetas HTML)
  const plainTextDesc = article.content ? article.content.replace(/<[^>]+>/g, '').substring(0, 140) + '...' : '';
  const heroImage = article.image || (article.content && (article.content.match(/<img[^>]+src="([^"]+)"/) || [])[1]) || '/img/default-historia.jpg';

  // Determinar el tipo de partículas según la categoría
  const particleType = 
    article.category === 'Edad Antigua' ? 'dust' :
    article.category === 'Edad Media' ? 'mist' :
    article.category === 'Reconquista' ? 'torch' :
    article.category === 'Imperio Español' ? 'gold' :
    article.category === 'Edad Contemporánea' ? 'sparks' :
    'dust';

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      {/* 🎬 EFECTOS CINEMATOGRÁFICOS OVERLAY */}
      <CinematicParticles
  type={particleType}
  isActive={!!article.isCinematic}
/>
            
      <button 
        onClick={onBack}
        style={{...btnPrimary, marginBottom: 20, background: "#64748b"}}
      >
        ← Volver a la lista
      </button>
      
      {/* 🎬 CABECERA CINEMATOGRÁFICA */}
      <div style={{ marginBottom: 20 }}>
        <CinematicCard
          image={heroImage}
          title={article.title}
          subtitle={`${article.category} • ${article.date}`}
          description={plainTextDesc}
          link="#"
          variant="alt"
          isDarkMode={isDarkMode}
          particles={particleType}
        />
      </div>
      
      {/* CONTENIDO PRINCIPAL DEL ARTÍCULO */}
      <div 
        style={{
          padding: '25px',
          borderRadius: '12px',
          background: isDarkMode ? '#1e293b' : '#fff',
          border: '2px solid #fbbf24',
          boxShadow: '0 0 20px rgba(251, 191, 36, 0.3)',
          lineHeight: '1.7'
        }}
      >
       <div 
  className="article-content"
  style={{color: isDarkMode ? "#e2e8f0" : "#111", fontSize: 16, lineHeight: 1.7, textAlign: "left"}}
  dangerouslySetInnerHTML={{ __html: article.content }}
        />
        
        <style>{`
          .article-content img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            margin: 20px 0;
            display: block;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .article-content p {
            margin: 10px 0;
          }
          .article-content h2, .article-content h3 {
            color: ${isDarkMode ? "#fbbf24" : "#1e3a8a"};
            margin: 25px 0 15px 0;
            font-family: Georgia, serif;
          }
          .article-content ul, .article-content ol {
            padding-left: 25px;
            margin: 15px 0;
          }
          .article-content li {
            margin: 8px 0;
          }
          .article-content blockquote {
            border-left: 4px solid ${isDarkMode ? "#fbbf24" : "#1d4ed8"};
            padding-left: 15px;
            margin: 20px 0;
            font-style: italic;
            color: ${isDarkMode ? "#94a3b8" : "#64748b"};
            background: ${isDarkMode ? "#0f172a" : "#f8fafc"};
            padding: 15px;
            border-radius: 0 8px 8px 0;
          }
        `}</style>
        
        <div style={{marginTop: 30, paddingTop: 20, borderTop: `1px solid ${isDarkMode ? "#334155" : "#e2e8f0"}`}}>
          <button onClick={() => exportToPDF(article)} style={btnPDF}>
            📄 Descargar PDF
          </button>
          {(role === "owner" || role === "admin" || (role === "editor" && article.authorId === user?.uid)) && (
            <>
              <button onClick={() => sendToTelegram(article)} style={{...btnPrimary, width: "100%", marginTop: 10}}>
                 Enviar a Telegram
              </button>
              <button onClick={() => startEdit(article)} style={{...btnPrimary, background: "#059669", width: "100%", marginTop: 10}}>
                ✏️ Editar
              </button>
              <button onClick={() => removeArticle(article.id)} style={{...btnDanger, width: "100%", marginTop: 10}}>
                🗑️ Eliminar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ArticlesView({ 
  articles, user, role, selectedArticle, setSelectedArticle, navigate,
  startEdit, removeArticle, sendToTelegram, exportToPDF, isNew, isDarkMode 
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchCategory, setSearchCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [openCategories, setOpenCategories] = useState(["Edad Antigua"]);

  const CATEGORIES = ["Edad Antigua", "Edad Media", "Reconquista", "Imperio Español", "Edad Contemporánea"];

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

  const openArticle = (article) => {
    console.log('🔗 Abriendo artículo:', article.title);
    console.log(' ID:', article.id || article.uid);
    setSelectedArticle(article);
    navigate('articles', article);
  };

  const closeArticle = () => {
    setSelectedArticle(null);
    navigate('articles');
  };

  // SI HAY UN ARTÍCULO SELECCIONADO, MOSTRAR VISTA COMPLETA
  if (selectedArticle) {
    return (
      <ArticleFullView 
        article={selectedArticle}
        user={user}
        role={role}
        startEdit={startEdit}
        removeArticle={removeArticle}
        sendToTelegram={sendToTelegram}
        exportToPDF={exportToPDF}
        isNew={isNew}
        isDarkMode={isDarkMode}
        onBack={closeArticle}
      />
    );
  }

  // SI NO HAY ARTÍCULO SELECCIONADO, MOSTRAR LISTA
  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <div className="search-bar" style={{ 
        background: isDarkMode ? "#1e293b" : "#fff",
        border: `1px solid ${isDarkMode ? "#334155" : "#e2e8f0"}`
      }}>
        <input 
          type="text" 
          className="search-input" 
          placeholder="🔍 Buscar por título o contenido..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            background: isDarkMode ? "#0f172a" : "#fff",
            color: isDarkMode ? "#e2e8f0" : "#111",
            border: `2px solid ${isDarkMode ? "#475569" : "#cbd5e1"}`
          }}
        />
        <div className="search-filters">
          <select 
            className="search-select"
            value={searchCategory}
            onChange={(e) => setSearchCategory(e.target.value)}
            style={{
              background: isDarkMode ? "#0f172a" : "#fff",
              color: isDarkMode ? "#e2e8f0" : "#111",
              border: `2px solid ${isDarkMode ? "#475569" : "#cbd5e1"}`
            }}
          >
            <option value="all">📚 Todas las épocas</option>
            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <select 
            className="search-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              background: isDarkMode ? "#0f172a" : "#fff",
              color: isDarkMode ? "#e2e8f0" : "#111",
              border: `2px solid ${isDarkMode ? "#475569" : "#cbd5e1"}`
            }}
          >
            <option value="newest">📅 Más recientes</option>
            <option value="oldest"> Más antiguos</option>
          </select>
          {(searchTerm || searchCategory !== "all" || sortBy !== "newest") && (
            <button onClick={clearFilters} style={{...btnPrimary, background: isDarkMode ? "#fff" : "#fff", color: "#1e3a8a", border: `2px solid ${isDarkMode ? "#fbbf24" : "#1d4ed8"}`, padding: "10px 16px"}}>🧹 Limpiar</button>
          )}
        </div>
        <div className="search-results-info" style={{ color: isDarkMode ? "#94a3b8" : "#64748b" }}>
          {filteredAndSortedArticles.length} resultado{filteredAndSortedArticles.length !== 1 ? 's' : ''} encontrado{filteredAndSortedArticles.length !== 1 ? 's' : ''}
          {searchTerm && <span> para "{searchTerm}"</span>}
        </div>
      </div>

      {CATEGORIES.map(cat => {
        const catArticles = articlesByCategory[cat];
        if (catArticles.length === 0) return null;
        const isOpen = openCategories.includes(cat);
        const hasNew = catArticles.some(isNew);

        return (
          <div key={cat} style={{ marginBottom: 15 }}>
            <div 
              className={`accordion-header ${isOpen ? 'active' : ''}`} 
              onClick={() => toggleCategory(cat)}
              style={{
                background: isDarkMode ? "#1e293b" : "#e2e8f0",
                borderLeft: `5px solid ${isDarkMode ? "#fbbf24" : "#1d4ed8"}`
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className={`accordion-icon ${isOpen ? 'open' : ''}`}>▶</span>
                <h2 style={{ margin: 0, fontSize: "18px", color: isDarkMode ? "#60a5fa" : "#1d4ed8" }}>📚 {cat}</h2>
                <span style={{ background: isDarkMode ? "#475569" : "#cbd5e1", borderRadius: 50, padding: "2px 8px", fontSize: 12, fontWeight: "bold", color: isDarkMode ? "#e2e8f0" : "#1e3a8a" }}>{catArticles.length}</span>
              </div>
              {hasNew && <span className="badge-new">🆕 NUEVO</span>}
            </div>
            <div className={`accordion-content ${isOpen ? '' : 'closed'}`}>
              {catArticles.map(a => (
                <ArticleCard 
                  key={a.id} 
                  a={a} 
                  isNew={isNew}
                  isDarkMode={isDarkMode}
                  onOpen={openArticle}
                />
              ))}
            </div>
          </div>
        );
      })}

      {filteredAndSortedArticles.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, background: isDarkMode ? "#1e293b" : "#fff", borderRadius: 12, border: `2px dashed ${isDarkMode ? "#475569" : "#cbd5e1"}` }}>
          <p style={{ fontSize: 40, marginBottom: 10 }}>🔍</p>
          <p style={{ fontWeight: "bold", color: isDarkMode ? "#60a5fa" : "#1e3a8a", marginBottom: 5 }}>No se encontraron artículos</p>
          <button onClick={clearFilters} style={btnPrimary}>🧹 Limpiar búsqueda</button>
        </div>
      )}
    </div>
  );
}