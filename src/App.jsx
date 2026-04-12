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
    <div style={{ display:"flex", minHeight:"100vh", background:"#020617", color:"#e2e8f0" }}>

      <div style={{
        width:"250px",
        padding:20,
        borderRight:"1px solid #1e293b"
      }}>
        <h2>📚 Navegación</h2>

        <select onChange={e => setFilter(e.target.value)}>
          <option value="Todas">Todas</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}