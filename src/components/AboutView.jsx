import { btnPrimary } from '../App';

export default function AboutView({ setView, isDarkMode }) {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "20px 0" }}>
      
      {/* CABECERA */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <h1 style={{ 
          fontSize: "32px", 
          fontWeight: "900", 
          color: isDarkMode ? "#fbbf24" : "#020617", 
          fontFamily: "Georgia, serif",
          marginBottom: 10
        }}>
          🏛️ Sobre Hispania Imperial
        </h1>
        <p style={{ 
          fontSize: "18px", 
          color: isDarkMode ? "#94a3b8" : "#64748b",
          fontStyle: "italic",
          fontFamily: "Georgia, serif"
        }}>
          "La historia bien contada es el mejor antídoto contra la leyenda"
        </p>
      </div>

      {/* MISIÓN */}
      <div style={{ 
        background: isDarkMode ? "#1e293b" : "#fff", 
        padding: 30, 
        borderRadius: 15, 
        marginBottom: 25,
        boxShadow: isDarkMode ? "0 4px 16px rgba(0,0,0,0.3)" : "0 4px 16px rgba(0,0,0,0.1)",
        border: `2px solid ${isDarkMode ? "#334155" : "#e2e8f0"}`
      }}>
        <h2 style={{ 
          fontSize: "24px", 
          color: isDarkMode ? "#fbbf24" : "#1e3a8a", 
          marginBottom: 20,
          fontFamily: "Georgia, serif",
          borderBottom: `2px solid ${isDarkMode ? "#fbbf24" : "#fbbf24"}`,
          paddingBottom: 10
        }}>
          🎯 Nuestra Misión
        </h2>
        <p style={{ lineHeight: 1.8, color: isDarkMode ? "#e2e8f0" : "#334155", fontSize: "16px" }}>
          <strong>Hispania Imperial</strong> nace con un propósito claro: <em>difundir la verdadera historia de España</em>, 
          libre de sesgos ideológicos, censura o la llamada "Leyenda Negra".
        </p>
        <p style={{ lineHeight: 1.8, color: isDarkMode ? "#e2e8f0" : "#334155", fontSize: "16px", marginTop: 15 }}>
          Creemos que el conocimiento histórico riguroso es la mejor herramienta para entender nuestro presente 
          y construir un futuro con identidad, orgullo y verdad.
        </p>
      </div>

      {/* PILARES */}
      <div style={{ 
        background: isDarkMode ? "#1e293b" : "#fff", 
        padding: 30, 
        borderRadius: 15, 
        marginBottom: 25,
        boxShadow: isDarkMode ? "0 4px 16px rgba(0,0,0,0.3)" : "0 4px 16px rgba(0,0,0,0.1)",
        border: `2px solid ${isDarkMode ? "#334155" : "#e2e8f0"}`
      }}>
        <h2 style={{ 
          fontSize: "24px", 
          color: isDarkMode ? "#fbbf24" : "#1e3a8a", 
          marginBottom: 20,
          fontFamily: "Georgia, serif",
          borderBottom: `2px solid ${isDarkMode ? "#fbbf24" : "#fbbf24"}`,
          paddingBottom: 10
        }}>
          🧱 Nuestros Pilares
        </h2>
        <ul style={{ lineHeight: 2, color: isDarkMode ? "#e2e8f0" : "#334155", fontSize: "16px", paddingLeft: 20 }}>
          <li><strong>Rigor histórico:</strong> Fuentes verificables, contexto completo, sin omisiones interesadas.</li>
          <li><strong>Accesibilidad:</strong> Contenido claro, bien estructurado, descargable en PDF para compartir.</li>
          <li><strong>Soberanía tecnológica:</strong> Plataforma propia, sin dependencia de algoritmos externos.</li>
          <li><strong>Comunidad:</strong> Espacio para lectores que valoran la verdad y la libertad de conocimiento.</li>
        </ul>
      </div>

      {/* CÓMO FUNCIONA */}
      <div style={{ 
        background: isDarkMode ? "#1e293b" : "#fff", 
        padding: 30, 
        borderRadius: 15, 
        marginBottom: 25,
        boxShadow: isDarkMode ? "0 4px 16px rgba(0,0,0,0.3)" : "0 4px 16px rgba(0,0,0,0.1)",
        border: `2px solid ${isDarkMode ? "#334155" : "#e2e8f0"}`
      }}>
        <h2 style={{ 
          fontSize: "24px", 
          color: isDarkMode ? "#fbbf24" : "#1e3a8a", 
          marginBottom: 20,
          fontFamily: "Georgia, serif",
          borderBottom: `2px solid ${isDarkMode ? "#fbbf24" : "#fbbf24"}`,
          paddingBottom: 10
        }}>
          ⚙️ Cómo Funciona
        </h2>
        <div style={{ display: "grid", gap: 15 }}>
          <div style={{ display: "flex", gap: 15, alignItems: "flex-start" }}>
            <span style={{ fontSize: 24 }}>📚</span>
            <div>
              <strong style={{ color: isDarkMode ? "#f1f5f9" : "#020617" }}>Explora por épocas</strong>
              <p style={{ margin: "5px 0 0 0", color: isDarkMode ? "#94a3b8" : "#64748b" }}>
                Artículos organizados desde la Edad Antigua hasta la Contemporánea, con buscador avanzado.
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 15, alignItems: "flex-start" }}>
            <span style={{ fontSize: 24 }}>📥</span>
            <div>
              <strong style={{ color: isDarkMode ? "#f1f5f9" : "#020617" }}>Descarga y comparte</strong>
              <p style={{ margin: "5px 0 0 0", color: isDarkMode ? "#94a3b8" : "#64748b" }}>
                Cada artículo se puede exportar a PDF con diseño imperial, listo para imprimir o difundir.
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 15, alignItems: "flex-start" }}>
            <span style={{ fontSize: 24 }}>✈️</span>
            <div>
              <strong style={{ color: isDarkMode ? "#f1f5f9" : "#020617" }}>Únete a Telegram</strong>
              <p style={{ margin: "5px 0 0 0", color: isDarkMode ? "#94a3b8" : "#64748b" }}>
                Recibe novedades, debates y contenido exclusivo en nuestro canal oficial.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* LLAMADA A LA ACCIÓN */}
      <div style={{ textAlign: "center", marginTop: 40 }}>
        <button 
          onClick={() => setView("articles")} 
          style={{
            ...btnPrimary,
            fontSize: "18px",
            padding: "16px 32px",
            background: isDarkMode 
              ? "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)" 
              : "linear-gradient(135deg, #1e3a8a 0%, #7c2d12 100%)",
            color: isDarkMode ? "#0f172a" : "#fff",
            border: "2px solid #fbbf24",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
          }}
        >
          📚 Comenzar a Explorar la Historia
        </button>
        <p style={{ 
          marginTop: 15, 
          fontSize: "14px", 
          color: isDarkMode ? "#94a3b8" : "#64748b",
          fontStyle: "italic"
        }}>
          Plus Ultra • Difundiendo verdad histórica desde {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}