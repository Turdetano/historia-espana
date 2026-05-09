export default function LinksView({ links, isDarkMode }) {
  return (
    <div style={{ marginTop: 40, maxWidth: 800, margin: "40px auto" }}>
      <h2 style={{ 
        fontWeight: "900", 
        fontSize: "26px", 
        color: isDarkMode ? "#fbbf24" : "#020617", 
        background: isDarkMode ? "#334155" : "#e2e8f0", 
        padding: "10px", 
        borderRadius: "8px", 
        display: "inline-block", 
        fontFamily: "Georgia, serif" 
      }}>🔗 Enlaces de interés</h2>
      <div style={{ marginTop: 20, display: "grid", gap: 15 }}>
        {links.length > 0 ? links.map(link => (
          <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" 
             style={{ 
               display: "block", 
               padding: 15, 
               background: isDarkMode ? "#1e293b" : "#fff", 
               borderRadius: 10, 
               fontWeight: "700", 
               color: isDarkMode ? "#f1f5f9" : "#0f172a", 
               textDecoration: "none", 
               boxShadow: isDarkMode ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.1)", 
               fontFamily: "Georgia, serif",
               border: `1px solid ${isDarkMode ? "#334155" : "#e2e8f0"}`
             }}>
            🔗 {link.name}
          </a>
        )) : <p style={{ textAlign: "center", color: isDarkMode ? "#94a3b8" : "#64748b" }}>No hay enlaces disponibles.</p>}
      </div>
    </div>
  );
}