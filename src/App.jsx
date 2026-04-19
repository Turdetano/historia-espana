import { db, auth } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
  setDoc
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

const btnPrimary = {
  background: "#1d4ed8",
  color: "#fff",
  padding: "12px 18px",
  borderRadius: 10,
  border: "none",
  cursor: "pointer",
  marginRight: 10,
  fontWeight: "bold"
};

const btnDanger = {
  background: "#b91c1c",
  color: "#fff",
  padding: "12px 18px",
  borderRadius: 10,
  border: "none",
  cursor: "pointer",
  fontWeight: "bold"
};

// CLOUDINARY
const uploadImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "historia_unsigned");

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/djlv6e9o3/image/upload",
      { method: "POST", body: formData }
    );

    const data = await res.json();
    return data.secure_url;
  } catch {
    alert("❌ Error al subir imagen");
    return null;
  }
};

export default function App() {
  const [articles, setArticles] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [selectedImage, setSelectedImage] = useState(null);

  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loadingRole, setLoadingRole] = useState(true);

  // AUTH + ROLES
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (u) {
        const ref = doc(db, "roles", u.uid);
        const snap = await getDoc(ref);

        if (u.uid === ADMIN_UID) setRole("admin");
        else if (snap.exists()) setRole(snap.data().role);
        else setRole("viewer");
      } else setRole(null);

      setLoadingRole(false);
    });

    return () => unsubscribe();
  }, []);

  // LOAD ARTICLES
  useEffect(() => {
    getDocs(collection(db, "articles")).then(s =>
      setArticles(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, []);

  const saveArticle = async (status) => {
    if (!title || !content) {
      alert("❌ Completa título y contenido");
      return;
    }

    setLoading(true);

    let imageUrl = "";

    if (selectedImage) {
      imageUrl = await uploadImage(selectedImage);
    }

    const art = {
      title,
      content,
      category,
      image: imageUrl,
      status,
      date: new Date().toLocaleDateString(),
      author: user?.email
    };

    if (editingId) {
      await updateDoc(doc(db, "articles", editingId), art);
      setArticles(prev =>
        prev.map(a => a.id === editingId ? { ...art, id: editingId } : a)
      );
    } else {
      const ref = await addDoc(collection(db, "articles"), art);
      setArticles(prev => [...prev, { ...art, id: ref.id }]);
    }

    // TELEGRAM
    if (status === "published") {
      try {
        await fetch("/api/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content })
        });
      } catch {}
    }

    resetForm();
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setSelectedImage(null);
    setEditingId(null);
    setLoading(false);
  };

  const startEdit = (a) => {
    setTitle(a.title);
    setContent(a.content);
    setCategory(a.category);
    setEditingId(a.id);
  };

  const remove = async (id) => {
    await deleteDoc(doc(db, "articles", id));
    setArticles(prev => prev.filter(a => a.id !== id));
  };

  const login = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);

  if (loadingRole) return <p>Cargando...</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1>📜 Historia de España</h1>

      {!user ? (
        <button onClick={login} style={btnPrimary}>Login</button>
      ) : (
        <button onClick={logout} style={btnDanger}>Logout</button>
      )}

      {(role === "admin" || role === "editor") && (
        <div>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título" />
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Contenido" />

          <input type="file" onChange={e => setSelectedImage(e.target.files[0])} />

          <button onClick={() => saveArticle("published")} style={btnPrimary}>
            🚀 Publicar
          </button>

          <button onClick={() => saveArticle("draft")} style={btnDanger}>
            💾 Guardar borrador
          </button>
        </div>
      )}

      {articles
        .filter(a => a.status === "published")
        .map(a => (
          <div key={a.id}>
            <h3>{a.title}</h3>
            {a.image && <img src={a.image} width="200" />}
            <p>{a.content}</p>
          </div>
        ))}
    </div>
  );
}