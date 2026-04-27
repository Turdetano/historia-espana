  // ==============================
  // 🎨 UI
  // ==============================

  return (
    <div style={{
      background: "#f1f5f9",
      minHeight: "100vh",
      padding: 20,
      fontFamily: "Segoe UI, Arial",
      color: "#111"
    }}>

      <h1 style={{
        textAlign: "center",
        fontSize: "36px",
        fontWeight: "900",
        color: "#020617"
      }}>
        📜 Historia de España
      </h1>

      {!user ? (
        <div style={{ textAlign: "center" }}>
          <button onClick={login} style={btnPrimary}>
            Iniciar sesión
          </button>
        </div>
      ) : (
        <div style={{ textAlign: "center" }}>
          <p>👤 {user.email}</p>
          <p>🔑 Rol: {role}</p>

          <button onClick={logout} style={btnDanger}>
            Cerrar sesión
          </button>

          {role === "owner" && (
            <div style={{ marginTop: 10 }}>
              <button onClick={makeAdmin} style={btnPrimary}>➕ Admin</button>
              <button onClick={makeEditor} style={btnPrimary}>➕ Editor</button>
            </div>
          )}
        </div>
      )}

      {/* 👤 USUARIOS */}
      {user && role === "owner" && (
        <div style={{
          background: "#fff",
          padding: 20,
          marginTop: 20,
          borderRadius: 10
        }}>
          <h2 style={{
            color: "#020617",
            background: "#e2e8f0",
            padding: "10px",
            borderRadius: "8px",
            display: "inline-block",
            fontWeight: "900"
          }}>
            👤 Usuarios del sistema
          </h2>

          {users.map(u => (
            <div key={u.uid} style={{
              marginBottom: 10,
              padding: 10,
              background: "#f8fafc",
              borderRadius: 8
            }}>
              <p><strong>UID:</strong> {u.uid}</p>
              <p><strong>Rol:</strong> {u.role}</p>

              <button onClick={() => toggleRole(u.uid, u.role)} style={btnPrimary}>
                🔄 Cambiar rol
              </button>

              <button onClick={() => deleteUserRole(u.uid)} style={btnDanger}>
                ❌ Eliminar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ✍️ FORMULARIO */}
      {user && (
        <div style={{
          background: "#ffffff",
          padding: 25,
          borderRadius: 12,
          maxWidth: 600,
          margin: "30px auto",
          boxShadow: "0 6px 18px rgba(0,0,0,0.2)"
        }}>
          <h2 style={{
            color: "#020617",
            background: "#e2e8f0",
            padding: "10px",
            borderRadius: "8px",
            display: "inline-block",
            fontWeight: "900"
          }}>
            ✍️ Crear artículo
          </h2>

          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título" style={{ width: "100%", marginBottom: 10, padding: 10 }} />
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Contenido" style={{ width: "100%", marginBottom: 10, padding: 10 }} />

          <select value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>

          <br /><br />

          <button onClick={publish} style={btnPrimary}>
            {editingId ? "💾 Guardar cambios" : "🚀 Publicar"}
          </button>
        </div>
      )}

      {/* 📚 ARTÍCULOS */}
      {CATEGORIES.map(cat => (
        <div key={cat}>
          <h2 style={{ color: "#1d4ed8" }}>📚 {cat}</h2>

          {articles.filter(a => a.category === cat).map(a => (
            <div key={a.id} style={{
              background: "#fff",
              padding: 15,
              marginBottom: 15,
              borderRadius: 10
            }}>
              <h3>{a.title}</h3>
              <p>{a.content}</p>

              {a.image && (
                <img src={a.image} style={{ maxWidth: "100%", marginTop: 10 }} />
              )}

              {user && (
                <div style={{ marginTop: 10 }}>

                  {canEditOrDelete(a) && (
                    <>
                      <button onClick={() => startEdit(a)} style={btnPrimary}>
                        Editar
                      </button>

                      <button onClick={() => remove(a.id)} style={btnDanger}>
                        Eliminar
                      </button>
                    </>
                  )}

                  {(role === "admin" || role === "owner") && (
                    <button onClick={() => sendToTelegram(a)} style={btnPrimary}>
                      Telegram
                    </button>
                  )}

                </div>
              )}

            </div>
          ))}
        </div>
      ))}

      {/* 🔗 ENLACES */}
      <div style={{ marginTop: 40 }}>
        <h2 style={{
          fontWeight: "900",
          fontSize: "26px",
          color: "#020617",
          background: "#e2e8f0",
          padding: "10px",
          borderRadius: "8px",
          display: "inline-block"
        }}>
          🔗 Enlaces de interés
        </h2>

        <div style={{ marginTop: 15 }}>
          {[
            { name: "Hispanopedia", url: "https://es.hispanopedia.com/wiki/Inicio" },
            { name: "Biblioteca Cervantes", url: "https://www.cervantesvirtual.com/" },
            { name: "Real Academia Española", url: "https://www.rae.es/" },
            { name: "Biblioteca Nacional de España", url: "https://www.bne.es/" },
            { name: "Genealogía", url: "https://bghyn.com/" },
            { name: "Real Academia de la Historia", url: "https://www.rah.es/" }
          ].map(link => (
            <p key={link.name}>
              <a href={link.url} target="_blank" style={{
                fontWeight: "900",
                color: "#0f172a",
                fontSize: "16px"
              }}>
                {link.name}
              </a>
            </p>
          ))}
        </div>
      </div>

    </div>
  );
}