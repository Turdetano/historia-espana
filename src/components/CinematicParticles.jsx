import { useEffect, useState } from 'react';

export default function CinematicParticles({ type, isActive }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (!isActive) return;

    const particleCount = type === 'dust' ? 50 : type === 'mist' ? 30 : 40;
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: type === 'dust' ? 3 + Math.random() * 4 : type === 'mist' ? 8 + Math.random() * 7 : 1 + Math.random() * 2,
      size: type === 'dust' ? 2 + Math.random() * 4 : type === 'mist' ? 50 + Math.random() * 100 : 10 + Math.random() * 30,
    }));
    setParticles(newParticles);
  }, [type, isActive]);

  if (!isActive) return null;

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
    </div>
  );
}