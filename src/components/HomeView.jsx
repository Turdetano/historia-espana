import { btnPrimary } from '../App';

export default function HomeView({ login, setView, user, isDarkMode }) {
  
  // 🔗 CONFIGURA AQUÍ TU ENLACE DE TELEGRAM
  const TELEGRAM_CHANNEL_URL = "https://t.me/Hispania_Imperial"; // 👈 CAMBIA ESTO POR TU ENLACE REAL

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
      
      {/* ESCUDO */}
      <div style={{ marginBottom: 30, padding: 20 }}>
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/8/8b/Escudo_de_los_Reyes_Catolicos_%281475-1492%29.svg" 
          alt="Escudo de los Reyes Católicos" 
          style={{ 
            width: "min(220px, 50vw)", 
            height: "auto", 
            objectFit: "contain", 
            filter: isDarkMode 
              ? "drop-shadow(0 4px 12px rgba(251,191,36,0.3))" 
              : "drop-shadow(0 4px 12px rgba(0,0,0,0.3))" 
          }} 
          onError={(e) => { e.target.style.display = 'none'; }} 
        />
      </div>
      
      {/* LEMA IMPERIAL */}
      <div style={{ 
        background: "linear-gradient(135deg, #1e3a8a 0%, #7c2d12 100%)", 
        color: "#fbbf24", 
        padding: "30px 20px", 
        borderRadius: 15, 
        marginBottom: 40, 
        boxShadow: isDarkMode ? "0 8px 24px rgba(251,191,36,0.2)" : "0 8px 24px rgba(0,0,0,0.3)", 
        border: "3px solid #fbbf24" 
      }}>
        <h2 style={{ fontSize: "52px", fontWeight: "900", margin: 0, textShadow: "3px 3px 6px rgba(0,0,0,0.5)", letterSpacing: "4px", fontFamily: "Georgia, 'Times New Roman', serif", textTransform: "uppercase" }}>
          🏛️ HISPANIA IMPERIAL 🏛️
        </h2>
        <p style={{ fontSize: "22px", marginTop: 15, fontStyle: "italic", color: "#fef3c7", fontFamily: "Georgia, serif", letterSpacing: "2px" }}>PLUS ULTRA</p>
      </div>
      
      {/* POEMA */}
      <div style={{ 
        background: isDarkMode ? "#1e293b" : "#fff", 
        padding: 40, 
        borderRadius: 15, 
        marginBottom: 40, 
        boxShadow: isDarkMode ? "0 4px 16px rgba(0,0,0,0.3)" : "0 4px 16px rgba(0,0,0,0.1)", 
        border: `2px solid ${isDarkMode ? "#334155" : "#e2e8f0"}` 
      }}>
        <h3 style={{ fontSize: "24px", color: isDarkMode ? "#fbbf24" : "#1e3a8a", marginBottom: 25, fontWeight: "700", borderBottom: `2px solid ${isDarkMode ? "#fbbf24" : "#fbbf24"}`, paddingBottom: 10, fontFamily: "Georgia, serif" }}>
          📜 España - Jorge Doré
        </h3>
        <div style={{ fontSize: "16px", lineHeight: 2.2, color: isDarkMode ? "#cbd5e1" : "#334155", fontStyle: "italic", whiteSpace: "pre-line", fontFamily: "Georgia, serif" }}>
          <p style={{ margin: "15px 0", fontWeight: "600" }}>
            ¡Qué triste España y qué amargo,<br />
            es ver como te debates<br />
            a vida o muerte entre turbas<br />
            de apóstatas y desleales!
          </p>
          <p style={{ margin: "15px 0", fontWeight: "600" }}>
            ¡Qué lamentable cortejo<br />
            de alimañas insaciables<br />
            te timonea escorada...
          </p>
        </div>
      </div>

      {/* 📢 BOTÓN TELEGRAM - VISIBLE PARA TODOS */}
      <div style={{ textAlign: "center", marginBottom: 30 }}>
        <a 
          href={TELEGRAM_CHANNEL_URL} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            background: isDarkMode 
              ? "linear-gradient(135deg, #229ED9 0%, #1c7db5 100%)" 
              : "linear-gradient(135deg, #229ED9 0%, #1c7db5 100%)",
            color: "#fff",
            padding: "16px 32px",
            borderRadius: 12,
            textDecoration: "none",
            fontWeight: "bold",
            fontSize: "18px",
            boxShadow: "0 4px 12px rgba(34, 158, 217, 0.4)",
            border: `2px solid ${isDarkMode ? "#fbbf24" : "#fbbf24"}`,
            transition: "transform 0.2s, box-shadow 0.2s",
            cursor: "pointer"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(34, 158, 217, 0.6)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(34, 158, 217, 0.4)";
          }}
        >
          ✈️ <span>Únete a nuestro canal de Telegram</span>
        </a>
        <p style={{ 
          fontSize: "14px", 
          color: isDarkMode ? "#94a3b8" : "#64748b", 
          marginTop: 10,
          fontStyle: "italic"
        }}>
          Difundiendo la verdadera historia de España, sin censura.
        </p>
      </div>
      
      {/* BOTÓN PRINCIPAL: EXPLORAR HISTORIA */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <button 
          onClick={() => setView("articles")} 
          style={{
            ...btnPrimary, 
            fontSize: "18px", 
            padding: "15px 30px", 
            background: isDarkMode ? "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)" : "linear-gradient(135deg, #1e3a8a 0%, #7c2d12 100%)", 
            color: isDarkMode ? "#0f172a" : "#fff", 
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)", 
            border: "2px solid #fbbf24" 
          }}
        >
          📚 Explorar la Historia de España
        </button>
      </div>
      
      {/* LOGIN PARA NO REGISTRADOS */}
      {!user && (
        <div style={{ textAlign: "center", marginTop: 40 }}>
          <p style={{ color: isDarkMode ? "#94a3b8" : "#64748b", marginBottom: 15 }}>Para crear o editar artículos, inicia sesión</p>
          <button onClick={login} style={btnPrimary}>🔐 Iniciar sesión</button>
        </div>
      )}
    </div>
  );
}