const CATEGORIES = [
  "Edad Antigua",
  "Edad Media",
  "Reconquista",
  "Imperio Español",
  "Edad Contemporánea"
];
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
      author: user?.email || "anon"
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
    <div style={{ padding:20 }}>
      <h1>Historia de España</h1>

      {!user ? (
        <button onClick={login}>Acceder</button>
      ) : (
        <>
          <p>{user.email}</p>
          <button onClick={logout}>Salir</button>
        </>
      )}

      <select onChange={e => setFilter(e.target.value)}>
        <option value="Todas">Todas</option>
        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
      </select>

      {isEditor && (
        <div>
          <input value={title} onChange={e => setTitle(e.target.value)} />
          <textarea value={content} onChange={e => setContent(e.target.value)} />
          <button onClick={!editingId ? publish : saveEdit}>
            {!editingId ? "Publicar" : "Guardar"}
          </button>
        </div>
      )}

      {filtered.map(a => (
        <div key={a.id}>
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
  );
}