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

// 📤 TELEGRAM
const sendToTelegram = async (article) => {
  try {
    const res = await fetch("/api/telegram", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(article)
    });

    const data = await res.json();

    if (data.success) {
      alert("✅ Enviado a Telegram");
    } else {
      alert("❌ Error al enviar");
    }
  } catch (err) {
    console.error(err);
    alert("❌ Error conexión");
  }
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
    if (!data.secure_url) throw new Error();

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (u) {
        try {
          const ref = doc(db, "roles", u.uid);
          const snap = await getDoc(ref);

          if (u.uid === ADMIN_UID) {
            setRole("owner");
          } else if (snap.exists()) {
            setRole(snap.data().role);
          } else {
            setRole("viewer");
          }
        } catch {
          setRole("viewer");
        }
      } else {
        setRole(null);
      }

      setLoadingRole(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    getDocs(collection(db, "articles")).then(s =>
      setArticles(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, []);

  const publish = async () => {
    if (loading) return;
    if (!title || !content) return alert("❌ Rellena todo");

    setLoading(true);

    let imageUrl = "";
    if (selectedImage) {
      imageUrl = await uploadImage(selectedImage);
      if (!imageUrl) return setLoading(false);
    }

    if (editingId) {
      await updateDoc(doc(db, "articles", editingId), {
        title,
        content,
        category,
        ...(imageUrl && { image: imageUrl })
      });

      setArticles(prev =>
        prev.map(a =>
          a.id === editingId
            ? { ...a, title, content, category, ...(imageUrl && { image: imageUrl }) }
            : a
        )
      );

      resetForm();
      return;
    }

    const art = {
      title,
      content,
      category,
      image: imageUrl,
      date: new Date().toLocaleDateString(),
      author: user?.email,
      authorId: user?.uid
    };

    const ref = await addDoc(collection(db, "articles"), art);
    setArticles(prev => [...prev, { ...art, id: ref.id }]);

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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (article) => {
    if (!confirm("¿Eliminar?")) return;

    if (role === "editor" && article.authorId !== user.uid) {
      return alert("❌ No permitido");
    }

    await deleteDoc(doc(db, "articles", article.id));
    setArticles(prev => prev.filter(a => a.id !== article.id));
  };

  const login = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);

  if (loadingRole) return <p>Cargando...</p>;

  return (
    <div style={{ padding: 20 }}>

      <h1 style={{ textAlign: "center" }}>📜 Historia de España</h1>

      {!user ? (
        <button onClick={login} style={btnPrimary}>Login</button>
      ) : (
        <>
          <p>{user.email}</p>
          <button onClick={logout} style={btnDanger}>Logout</button>
        </>
      )}

      {(role === "owner" || role === "admin" || role === "editor") && (
        <div style={{ background: "#fff", padding: 20, marginTop: 20 }}>
          <h2 style={{ color: "#1d4ed8" }}>
            ✍️ {editingId ? "Editar artículo" : "Crear artículo"}
          </h2>

          <input value={title} onChange={e => setTitle(e.target.value)} />
          <textarea value={content} onChange={e => setContent(e.target.value)} />

          <input type="file" onChange={e => setSelectedImage(e.target.files[0])} />

          <button onClick={publish} style={btnPrimary}>
            {editingId ? "Actualizar" : "Publicar"}
          </button>
        </div>
      )}

      {articles.map(a => (
        <div key={a.id}>
          <h3>{a.title}</h3>
          {a.image && <img src={a.image} style={{ width: "100%" }} />}
          <p>{a.content}</p>

          {(role === "owner" || role === "admin" || (role === "editor" && a.authorId === user?.uid)) && (
            <>
              <button onClick={() => startEdit(a)}>Editar</button>
              <button onClick={() => sendToTelegram(a)}>📤 Telegram</button>
              <button onClick={() => remove(a)}>Eliminar</button>
            </>
          )}
        </div>
      ))}

      {/* 🔗 ENLACES */}
      <div style={{ marginTop: 40 }}>
        <h2>🔗 Enlaces de interés</h2>

        <p><a href="https://es.hispanopedia.com/wiki/Inicio" target="_blank">Hispanopedia</a></p>
        <p><a href="https://www.cervantesvirtual.com/" target="_blank">Biblioteca Cervantes</a></p>
        <p><a href="https://www.rae.es/" target="_blank">RAE</a></p>
        <p><a href="https://pares.culturaydeporte.gob.es/" target="_blank">PARES</a></p>
        <p><a href="https://www.bne.es/" target="_blank">Biblioteca Nacional</a></p>
      </div>

    </div>
  );
}