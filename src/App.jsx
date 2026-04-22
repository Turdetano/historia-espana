import { db, auth } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  getDoc
} from "firebase/firestore";
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import { useState, useEffect } from "react";

const provider = new GoogleAuthProvider();
const ADMIN_UID = "PVBWPZUwVwZnwAnaA5F0a6UuqF83";

const CATEGORIES = [
  "Edad Antigua",
  "Edad Media",
  "Reconquista",
  "Imperio Español",
  "Edad Contemporánea"
];

export default function App() {

  const [articles, setArticles] = useState([]);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [editingId, setEditingId] = useState(null);

  // 🔒 SEGURIDAD
  const checkAuth = () => {
    if (!user) {
      alert("🔒 Debes iniciar sesión");
      return false;
    }
    return true;
  };

  // 🔐 AUTH
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (u) {
        const ref = doc(db, "roles", u.uid);
        const snap = await getDoc(ref);

        if (u.uid === ADMIN_UID) setRole("owner");
        else if (snap.exists()) setRole(snap.data().role);
        else setRole("viewer");
      }
    });

    return () => unsubscribe();
  }, []);

  // 📚 CARGA
  useEffect(() => {
    getDocs(collection(db, "articles")).then(s =>
      setArticles(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, []);

  // 🚀 PUBLICAR / EDITAR
  const publish = async () => {
    if (!checkAuth()) return;

    if (!title || !content) {
      alert("❌ Rellena título y contenido");
      return;
    }

    if (editingId) {
      await updateDoc(doc(db, "articles", editingId), {
        title,
        content,
        category
      });

      setArticles(prev =>
        prev.map(a =>
          a.id === editingId ? { ...a, title, content, category } : a
        )
      );

      resetForm();
      return;
    }

    const art = {
      title,
      content,
      category,
      date: new Date().toLocaleDateString(),
      author: user?.email || "Anónimo"
    };

    const ref = await addDoc(collection(db, "articles"), art);
    setArticles(prev => [...prev, { ...art, id: ref.id }]);

    resetForm();
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setEditingId(null);
  };

  const startEdit = (a) => {
    if (!checkAuth()) return;

    setTitle(a.title);
    setContent(a.content);
    setCategory(a.category);
    setEditingId(a.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (id) => {
    if (!checkAuth()) return;

    if (!confirm("¿Eliminar este artículo?")) return;

    await deleteDoc(doc(db, "articles", id));
    setArticles(prev => prev.filter(a => a.id !== id));
  };

  const sendToTelegram = async (a) => {
    if (!checkAuth()) return;

    if (!confirm("¿Enviar a Telegram?")) return;

    await fetch("/api/telegram", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(a)
    });

    alert("✅ Enviado");
  };

  const login = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);

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
        color: "#000"
      }}>
        📜 Historia de España
      </h1>

      {!user ? (
        <button onClick={login}>
          Iniciar sesión
        </button>
      ) : (
        <div style={{ textAlign: "center" }}>
          <p>{user.email}</p>
          <button onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      )}

      {/* FORMULARIO */}
      {user && (
        <div style={{
          background: "#fff",
          padding: 20,
          borderRadius: 10,
          maxWidth: 600,
          margin: "30px auto"
        }}>
          <h2>✍️ Crear artículo</h2>

          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título" style={{ width: "100%", marginBottom: 10 }} />
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Contenido" style={{ width: "100%", marginBottom: 10 }} />

          <select value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>

          <br /><br />

          <button onClick={publish}>
            {editingId ? "Actualizar" : "Publicar"}
          </button>
        </div>
      )}

      {/* ARTÍCULOS */}
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

              {/* 🖼 IMAGEN RESTAURADA */}
              {a.image && (
                <img src={a.image} style={{ maxWidth: "100%", marginTop: 10 }} />
              )}

              {user && (
                <>
                  <button onClick={() => startEdit(a)}>Editar</button>
                  <button onClick={() => remove(a.id)}>Eliminar</button>
                  <button onClick={() => sendToTelegram(a)}>Telegram</button>
                </>
              )}
            </div>
          ))}
        </div>
      ))}

      {/* ENLACES */}
      <div style={{ marginTop: 40 }}>
        <h2>🔗 Enlaces de interés</h2>

        <p><a href="https://es.hispanopedia.com/wiki/Inicio" target="_blank">Hispanopedia</a></p>
        <p><a href="https://www.cervantesvirtual.com/" target="_blank">Biblioteca Cervantes</a></p>
        <p><a href="https://www.rae.es/" target="_blank">Real Academia Española</a></p>
        <p><a href="https://www.bne.es/" target="_blank">Biblioteca Nacional de España</a></p>
        <p><a href="https://bghyn.com/" target="_blank">Genealogía</a></p>
        <p><a href="https://www.rah.es/" target="_blank">Real Academia de la Historia</a></p>
      </div>

    </div>
  );
}