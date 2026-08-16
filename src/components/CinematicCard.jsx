// src/components/CinematicCard.jsx
// 🎬 CABECERA HERO DEL ARTÍCULO
// Imagen con efecto kenBurns + categoría + título + entradilla.
export default function CinematicCard({
  image,
  title,
  subtitle,
  description,
  isDarkMode,
  variant,   // aceptado por compatibilidad con ArticlesView
  link,      // aceptado por compatibilidad
  particles  // aceptado por compatibilidad
}) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        minHeight: 320,
        borderRadius: 14,
        overflow: "hidden",
        border: `2px solid ${isDarkMode ? "#fbbf24" : "#1e3a8a"}`,
        boxShadow: isDarkMode ? "0 8px 30px rgba(0,0,0,0.5)" : "0 8px 24px rgba(0,0,0,0.2)",
        background: isDarkMode ? "#0f172a" : "#e2e8f0",
      }}
    >
      {/* IMAGEN CON EFECTO KEN BURNS */}
      <div
        className={variant === "alt" ? "animate-ken-burns-alt" : "animate-ken-burns"}
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      {/* DEGRADADO PARA LEGIBILIDAD DEL TEXTO */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(2,6,23,0.95) 0%, rgba(2,6,23,0.65) 45%, rgba(2,6,23,0.15) 100%)",
        }}
      />
      {/* TEXTOS */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: "20px 22px",
          textAlign: "left",
        }}
      >
        {subtitle && (
          <p
            style={{
              margin: "0 0 8px 0",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: "#fbbf24",
              fontFamily: "Georgia, serif",
              textShadow: "1px 1px 3px rgba(0,0,0,0.8)",
            }}
          >
            {subtitle}
          </p>
        )}
        <h1
          style={{
            margin: "0 0 10px 0",
            fontSize: "clamp(24px, 5vw, 38px)",
            fontWeight: 900,
            color: "#fff",
            fontFamily: "Georgia, serif",
            lineHeight: 1.15,
            textAlign: "left",
            textShadow: "2px 2px 6px rgba(0,0,0,0.85)",
          }}
        >
          {title}
        </h1>
        {description && (
          <p
            style={{
              margin: 0,
              fontSize: 15,
              lineHeight: 1.6,
              color: "#e2e8f0",
              textShadow: "1px 1px 3px rgba(0,0,0,0.8)",
            }}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  );
}