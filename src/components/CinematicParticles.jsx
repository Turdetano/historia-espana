import { useEffect, useState } from 'react';

export default function CinematicParticles({ type, isActive }) {
  const [particles, setParticles] = useState([]);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setShouldRender(false);
      return;
    }

    //  DETECTAR PREFERENCIA DE MOVIMIENTO REDUCIDO (Accesibilidad)
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      setShouldRender(false);
      return;
    }

    setShouldRender(true);

    // Configuración según tipo (OPTIMIZADA - Menos partículas)
    const configs = {
      dust: { count: 30, minSize: 2, maxSize: 4, duration: [3, 7] },      // Antes: 50
      mist: { count: 20, minSize: 50, maxSize: 100, duration: [8, 15] },  // Antes: 30
      torch: { count: 25, minSize: 10, maxSize: 30, duration: [1, 3] },   // Antes: 40
      gold: { count: 35, minSize: 3, maxSize: 6, duration: [2, 5] },      // Antes: 60
      sparks: { count: 40, minSize: 1, maxSize: 3, duration: [1, 2] }     // Antes: 70
    };

    const config = configs[type] || configs.dust;
    const particleCount = config.count;
    
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: config.duration[0] + Math.random() * (config.duration[1] - config.duration[0]),
      size: config.minSize + Math.random() * (config.maxSize - config.minSize),
    }));
    setParticles(newParticles);
  }, [type, isActive]);

  if (!shouldRender) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
      zIndex: 9999,
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes float-up {
          0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% { transform: translateY(-100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes fog-drift {
          0%, 100% { transform: translateX(-20%) scale(1); opacity: 0.3; }
          50% { transform: translateX(20%) scale(1.1); opacity: 0.6; }
        }
        @keyframes flame-flicker {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.2); opacity: 1; }
        }
        @keyframes gold-shine {
          0%, 100% { transform: translateY(100vh) scale(1); opacity: 0; filter: brightness(1); }
          10% { opacity: 0.9; filter: brightness(1.5); }
          50% { opacity: 1; filter: brightness(2); }
          90% { opacity: 0.9; filter: brightness(1.5); }
          100% { transform: translateY(-100vh) scale(0.5); opacity: 0; filter: brightness(1); }
        }
        @keyframes spark-zoom {
          0% { transform: translateY(100vh) translateX(0) scale(0); opacity: 0; }
          10% { opacity: 1; transform: translateY(90vh) translateX(20px) scale(1); }
          50% { opacity: 1; transform: translateY(50vh) translateX(-20px) scale(1.2); }
          90% { opacity: 1; transform: translateY(10vh) translateX(10px) scale(1); }
          100% { transform: translateY(-100vh) translateX(0) scale(0); opacity: 0; }
        }
        
        .particle-dust {
          position: absolute;
          background: radial-gradient(circle, rgba(255,215,0,0.8) 0%, transparent 70%);
          border-radius: 50%;
          animation: float-up linear infinite;
          filter: blur(1px);
        }
        .particle-mist {
          position: absolute;
          background: radial-gradient(ellipse, rgba(200,210,220,0.4) 0%, transparent 70%);
          border-radius: 50%;
          animation: fog-drift ease-in-out infinite;
          filter: blur(30px);
        }
        .particle-torch {
          position: absolute;
          background: radial-gradient(circle, rgba(255,107,53,0.9) 0%, rgba(247,147,30,0) 70%);
          border-radius: 50%;
          animation: flame-flicker ease-in-out infinite;
          filter: blur(3px);
        }
        .particle-gold {
          position: absolute;
          background: radial-gradient(circle, rgba(255,215,0,1) 0%, rgba(255,223,0,0.8) 40%, transparent 70%);
          border-radius: 50%;
          animation: gold-shine linear infinite;
          filter: blur(0.5px);
          box-shadow: 0 0 10px rgba(255,215,0,0.8);
        }
        .particle-sparks {
          position: absolute;
          background: radial-gradient(circle, rgba(100,200,255,1) 0%, rgba(0,150,255,0.8) 40%, transparent 70%);
          border-radius: 50%;
          animation: spark-zoom ease-out infinite;
          filter: blur(0.5px);
          box-shadow: 0 0 8px rgba(100,200,255,0.9);
        }
      `}</style>

      {type === 'dust' && particles.map((p) => (
        <div key={p.id} className="particle-dust" style={{
          left: `${p.left}%`,
          width: `${p.size}px`,
          height: `${p.size}px`,
          animationDuration: `${p.duration}s`,
          animationDelay: `${p.delay}s`,
          bottom: '-20px',
        }} />
      ))}

      {type === 'mist' && particles.map((p) => (
        <div key={p.id} className="particle-mist" style={{
          left: `${p.left}%`,
          width: `${p.size}px`,
          height: `${p.size * 0.6}px`,
          animationDuration: `${p.duration}s`,
          animationDelay: `${p.delay}s`,
          top: `${Math.random() * 100}%`,
        }} />
      ))}

      {type === 'torch' && particles.map((p) => (
        <div key={p.id} className="particle-torch" style={{
          left: `${p.left}%`,
          width: `${p.size}px`,
          height: `${p.size}px`,
          animationDuration: `${p.duration}s`,
          animationDelay: `${p.delay}s`,
          bottom: `${Math.random() * 50}%`,
        }} />
      ))}

      {type === 'gold' && particles.map((p) => (
        <div key={p.id} className="particle-gold" style={{
          left: `${p.left}%`,
          width: `${p.size}px`,
          height: `${p.size}px`,
          animationDuration: `${p.duration}s`,
          animationDelay: `${p.delay}s`,
          bottom: '-20px',
        }} />
      ))}

      {type === 'sparks' && particles.map((p) => (
        <div key={p.id} className="particle-sparks" style={{
          left: `${p.left}%`,
          width: `${p.size}px`,
          height: `${p.size}px`,
          animationDuration: `${p.duration}s`,
          animationDelay: `${p.delay}s`,
          bottom: '-20px',
        }} />
      ))}
    </div>
  );
}