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

// 📸 SUBIR IMAGEN
const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "historia_unsigned");

  try {
    const res = await fetch(
      "https://api.cloudinary.com/v1_1/dlv8e9o3/image/upload",
      { method: "POST", body: formData }
    );
    const data = await res.json();
    return data.secure_url;
  } catch {
    return null;
  }
};

// 🕓 HISTORIAL
const saveHistory = async (action, article, user) => {
  if (!article) return;

  await addDoc(collection(db, "history"), {
    action,
    articleId: article.id,
    title: article.title,
    content: article.content,
    image: article.image || "",
    category: article.category || "",
    editedBy: user?.email || "desconocido",
    date: new Date().toLocaleString()
  });
};

// 📊 MÉTRICAS
const getStats = (articles, users, history) => ({
  totalArticles: articles.length,
  totalUsers: users.length,
  totalEdits: history.filter(h => h.action === "edit").length,
  totalDeletes: history.filter(h => h.action === "delete").length
});

// 🧾 DIFF SIMPLE
const getDiff = (oldText, newText) => {
  if (!oldText || !newText) return "";
  const oldWords = oldText.split(" ");
  const newWords = newText.split(" ");
  return newWords.map(w => oldWords.includes(w) ? w : `🟢${w}`).join(" ");
};

export default function App() {
  const [articles, setArticles] = useState([]);
  const [history, setHistory] = useState([]);
  const [usersList, setUsersList] = useState([]);

  const [stats, setStats] = useState(null);
  const [diffView, setDiffView] = useState(null);
  const [selectedHistory, setSelectedHistory] = useState(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);

  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

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

  useEffect(() => {
    if (role === "admin") {
      getDocs(collection(db, "history")).then(s =>
        setHistory(s.docs.map(d => ({ id: d.id, ...d.data() })).reverse())
      );

      getDocs(collection(db, "users")).then(s =>
        setUsersList(s.docs.map(d => ({ id: d.id, ...d.data() })))
      );
    }
  }, [role]);

  useEffect(() => {
    if (role === "admin") {
      setStats(getStats(articles, usersList, history));
    }
  }, [articles, usersList, history]);

  const isAdmin = role === "admin";
  const isEditor = role === "admin" || role === "editor";

  const publish = async () => {
    if (!isEditor) return;

    let img = imageUrl;
    if (selectedImage) img = await uploadImage(selectedImage);

    const art = {
      title,
      content,
      image: img || "",
      category,
      date: new Date().toLocaleDateString(),
      author: user.email
    };

    const ref = await addDoc(collection(db, "articles"), art);
    setArticles([...articles, { ...art, id: ref.id }]);

    setTitle(""); setContent(""); setImageUrl(""); setSelectedImage(null);
  };

  const saveEdit = async () => {
    let img = imageUrl;
    if (selectedImage) img = await uploadImage(selectedImage);

    const old = articles.find(a => a.id === editingId);
    await saveHistory("edit", old, user);

    await updateDoc(doc(db, "articles", editingId), {
      title, content, image: img, category
    });

    window.location.reload();
  };

  const remove = async (id) => {
    const art = articles.find(a => a.id === id);
    await saveHistory("delete", art, user);

    await deleteDoc(doc(db, "articles", id));
    setArticles(articles.filter(a => a.id !== id));
  };

  const restoreVersion = async (h) => {
    await updateDoc(doc(db, "articles", h.articleId), {
      title: h.title,
      content: h.content,
      image: h.image,
      category: h.category
    });
    window.location.reload();
  };

  const changeRole = async (uid, role) => {
    await updateDoc(doc(db, "users", uid), { role });
  };

  const login = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);

  const filtered = filter === "Todas"
    ? articles
    : articles.filter(a => a.category === filter);

  return (
    <div style={{ background:"#020617", color:"#e2e8f0", minHeight:"100vh", padding:20 }}>
      <h1 style={{ textAlign:"center", fontSize:32 }}>📜 Historia de España</h1>

      {!user ? (
        <button onClick={login}>Acceder</button>
      ) : (
        <>
          <p>Bienvenido 👑</p>
          <button onClick={logout}>Cerrar sesión</button>
        </>
      )}

      {isAdmin && stats && (
        <div>
          <h2>📊 Dashboard</h2>
          <p>Artículos: {stats.totalArticles}</p>
          <p>Usuarios: {stats.totalUsers}</p>
        </div>
      )}

      {isAdmin && (
        <div>
          <h2>Usuarios</h2>
          {usersList.map(u => (
            <div key={u.id}>
              {u.email} - {u.role}
              <select onChange={e => changeRole(u.id, e.target.value)}>
                <option>user</option>
                <option>editor</option>
                <option>admin</option>
              </select>
            </div>
          ))}
        </div>
      )}

      {isAdmin && (
        <div>
          <h2>Historial</h2>
          {history.map(h => (
            <div key={h.id}>
              {h.title}
              <button onClick={() => {
                setSelectedHistory(h);
                const current = articles.find(a => a.id === h.articleId);
                if (current) setDiffView(getDiff(h.content, current.content));
              }}>Ver</button>
              <button onClick={() => restoreVersion(h)}>Restaurar</button>
            </div>
          ))}

          {diffView && <p>{diffView}</p>}
        </div>
      )}

      <div>
        {filtered.map(a => (
          <div key={a.id}>
            <h3>{a.title}</h3>
            <p>{a.content}</p>
            {isEditor && <button onClick={() => remove(a.id)}>Eliminar</button>}
          </div>
        ))}
      </div>
    </div>
  );
}