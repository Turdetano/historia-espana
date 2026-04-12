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

const CATEGORIES = [
  "Edad Antigua",
  "Edad Media",
  "Reconquista",
  "Imperio Español",
  "Edad Contemporánea"
];

export default function App() {
  const [articles, setArticles] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);

  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [filter, setFilter] = useState("Todas");

  useEffect(() => {
    onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(db, "users", u.uid));
        setRole(snap.exists() ? snap.data().role : "user");
      } else {
        setRole(null);
      }
    });
  }, []);

  useEffect(() => {
    getDocs(collection(db, "articles")).then(s =>
      setArticles(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, []);

  const isAdmin = role === "admin";
  const isEditor = role === "admin" || role === "editor";

  const publish = async () => {
    if (!isEditor) return;

    const art = {
      title,
      content,
      category,
      date: new Date().toLocaleDateString(),
      author: user.email
    };

    const ref = await addDoc(collection(db, "articles"), art);
    setArticles([...articles, { ...art, id: ref.id }]);

    setTitle("");
    setContent("");
    setEditingId(null);
  };

  const startEdit = (a) => {
    setTitle(a.title);
    setContent(a.content);
    setCategory(a.category);
    setEditingId(a.id);
  };

  const saveEdit = async () => {
    await updateDoc(doc(db, "articles", editingId), {
      title,
      content,
      category
    });
    window.location.reload();
  };

  const remove = async (id) => {
    await deleteDoc(doc(db, "articles", id));
    setArticles(articles.filter(a => a.id !== id));
  };

  const login = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);

  const filtered = filter === "Todas"
    ? articles
    : articles.filter(a => a.category === filter);

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#020617", color:"#e2e8f0" }}>

      {/* 🔵 SIDEBAR */}
      <div style={{
        width:"250px",
        background:"#020617",
        padding:20,
        borderRight:"1px solid #1e293b"
      }}>
        <h2>📚 Navegación</h2>

        <select onChange={e => setFilter(e.target.value)}>
          <option value="Todas">Todas</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>

        <h3 style={{ marginTop:20 }}>🔗 Enlaces</h3>
        <ul>
          <li><a href="https://es.wikipedia.org/wiki/Historia_de_Espa%C3%B1a" target="_blank">Wikipedia</a></li>
          <li><a href="https://www.bne.es" target="_blank">Biblioteca Nacional</a></li>
        </ul>

        <h3 style={{ marginTop:20 }}>📲 Comunidad</h3>
        <a href="https://t.me/" target="_blank">Telegram</a>
      </div>

      {/* 🟢 CONTENIDO */}
      <div style={{ flex:1, padding:20 }}>

        <h1 style={{ textAlign:"center" }}>📜 Historia de España</h1>

        {!user ? (
          <button onClick={login} style={{
            background:"#2563eb",
            color:"#fff",
            padding:"10px",
            borderRadius:8
          }}>
            Acceder con Google
          </button>
        ) : (
          <div>
            <p>👑 {user.email}</p>
            <button onClick={logout}>Cerrar sesión</button>
          </div>
        )}

        {isEditor && (
          <div style={{ marginTop:20 }}>
            <h2>✍️ Crear / Editar</h2>

            <input
              placeholder="Título"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />

            <textarea
              placeholder="Contenido"
              value={content}
              onChange={e => setContent(e.target.value)}
            />

            <select value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>

            {!editingId
              ? <button onClick={publish}>Publicar</button>
              : <button onClick={saveEdit}>Guardar</button>
            }
          </div>
        )}

        <div style={{ marginTop:30 }}>
          {filtered.map(a => (
            <div key={a.id} style={{
              background:"#0f172a",
              padding:15,
              marginBottom:15,
              borderRadius:10
            }}>
              <h3>{a.title}</h3>
              <p>{a.content}</p>

              {isEditor && (
                <>
                  <button onClick={() => startEdit(a)}>Editar</button>
                  <button onClick={() => remove(a.id)}>Eliminar</button>
                </>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}