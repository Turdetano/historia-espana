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
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);

  useEffect(() => {
    onAuthStateChanged(auth, async (u) => {
      console.log("USER:", u);

      setUser(u);

      if (u) {
        const snap = await getDoc(doc(db, "users", u.uid));
        console.log("DOC:", snap.data());

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
    <div style={{ background:"#0f172a", color:"#fff", minHeight:"100vh", padding:20 }}>
      <h1 style={{ textAlign:"center" }}>📜 Historia de España</h1>

      {!user ? (
        <button
          onClick={login}
          style={{
            background:"#2563eb",
            color:"#fff",
            padding:"12px 20px",
            borderRadius:8,
            border:"none",
            cursor:"pointer",
            display:"block",
            margin:"20px auto"
          }}
        >
          Acceder con Google
        </button>
      ) : (
        <div style={{ textAlign:"center" }}>
          <p>{user.email}</p>
          <button onClick={logout}>Cerrar sesión</button>
        </div>
      )}

      {isEditor && (
        <div style={{ marginTop:20 }}>
          <h2>✍️ Crear artículo</h2>

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

          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            {CATEGORIES.map(c => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <button onClick={publish}>Publicar</button>
        </div>
      )}

      <div style={{ marginTop:30 }}>
        {articles.map(a => (
          <div key={a.id} style={{
            background:"#1e293b",
            padding:15,
            borderRadius:10,
            marginBottom:15
          }}>
            <h3>{a.title}</h3>
            <p>{a.content}</p>
            <small>{a.category}</small>

            {isEditor && (
              <button onClick={() => remove(a.id)}>
                Eliminar
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}