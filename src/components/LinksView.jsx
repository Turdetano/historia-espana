export default function LinksView({ links }) {
  return (
    <div style={{ marginTop: 40, maxWidth: 800, margin: "40px auto" }}>
      <h2 style={{ fontWeight: "900", fontSize: "26px", color: "#020617", background: "#e2e8f0", padding: "10px", borderRadius: "8px", display: "inline-block", fontFamily: "Georgia, serif" }}>🔗 Enlaces de interés</h2>
      <div style={{ marginTop: 20, display: "grid", gap: 15 }}>
        {links.length > 0 ? links.map(link => (
          <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" style={{ display: "block", padding: 15, background: "#fff", borderRadius: 10, fontWeight: "700", color: "#0f172a", textDecoration: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", fontFamily: "Georgia, serif" }}>🔗 {link.name}</a>
        )) : <p style={{ textAlign: "center", color: "#64748b" }}>No hay enlaces disponibles.</p>}
      </div>
    </div>
  );
}