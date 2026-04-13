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
  };

  const remove = async (id) => {
    await deleteDoc(doc(db, "articles", id));
    setArticles(articles.filter(a => a.id !== id));
  };

  const login = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);

  return (
    <div style={{
      background: "#f8fafc",
      color: "#1e293b",
      minHeight: "100vh",
      padding: 20,
      fontFamily: "Arial"
    }}>
      
      <h1 style={{ textAlign: "center" }}>
        📜 Historia de España
      </h1>

      {!user ? (
        <button onClick={login} style={{
          background: "#2563eb",
          color: "#fff",
          padding: "10px 20px",
          borderRadius: 8,
          border: "none",
          cursor: "pointer",
          display: "block",
          margin: "20px auto"
        }}>
          Iniciar sesión con Google
        </button>
      ) : (
        <div style={{ textAlign: "center" }}>
          <p>👤 {user.email}</p>

          <button onClick={logout} style={{
            background: "#dc2626",
            color: "#fff",
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer"
          }}>
            Cerrar sesión
          </button>
        </div>
      )}

      {isEditor && (
        <div style={{ marginTop: 30 }}>
          <h2>✍️ Crear artículo</h2>

          <input
            placeholder="Título"
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{ display: "block", marginBottom: 10, width: "100%" }}
          />

          <textarea
            placeholder="Contenido"
            value={content}
            onChange={e => setContent(e.target.value)}
            style={{ display: "block", marginBottom: 10, width: "100%" }}
          />

          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            {CATEGORIES.map(c => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <br /><br />

          <button onClick={publish} style={{
            background: "#16a34a",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer"
          }}>
            Publicar
          </button>
        </div>
      )}

      <div style={{ marginTop: 40 }}>
        <h2>📚 Artículos</h2>

        {articles.map(a => (
          <div key={a.id} style={{
            border: "1px solid #ccc",
            padding: 10,
            marginBottom: 10,
            borderRadius: 8,
            background: "#fff"
          }}>
            <h3>{a.title}</h3>
            <p>{a.content}</p>
            <small>{a.category} | {a.date}</small>

            {isEditor && (
              <div>
                <button onClick={() => remove(a.id)}>
                  ❌ Eliminar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}