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

// 🔥 SUPER ADMIN (NUNCA PIERDES CONTROL)
const ADMIN_UID = "PVBWPZUwVwZnwAnaA5F0a6UuqF83";

const CATEGORIES = [
  "Edad Antigua",
  "Edad Media",
  "Reconquista",
  "Imperio Español",
  "Edad Contemporánea"
];

// BOTONES
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

  // 🔐 AUTH + ROLES
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (u) {
        try {
          const ref = doc(db, "roles", u.uid);
          const snap = await getDoc(ref);

          // 🔥 SUPER ADMIN FORZADO
          if (u.uid === ADMIN_UID) {
            setRole("admin");
          } else if (snap.exists()) {
            setRole(snap.data().role);
          } else {
            setRole("viewer");
          }

        } catch (err) {
          console.error(err);
          setRole("viewer");
        }
      } else {
        setRole(null);
      }

      setLoadingRole(false);
    });

    return () => unsubscribe();
  }, []);

  // 📚 ARTÍCULOS
  useEffect(() => {
    getDocs(collection(db, "articles")).then(s =>
      setArticles(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, []);

  const publish = async () => {
    if (loading) return;

    if (!title || !content) {
      alert("❌ Rellena título y contenido");
      return;
    }

    setLoading(true);

    let imageUrl = "";

    if (selectedImage) {
      imageUrl = await uploadImage(selectedImage);
      if (!imageUrl) {
        setLoading(false);
        return;
      }
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
      author: user?.email || "Anónimo"
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

  const remove = async (id) => {
    if (!confirm("¿Eliminar este artículo?")) return;
    await deleteDoc(doc(db, "articles", id));
    setArticles(prev => prev.filter(a => a.id !== id));
  };

  const login = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);

  const makeAdmin = async () => {
    const uid = prompt("UID del nuevo admin:");
    if (!uid) return;

    await setDoc(doc(db, "roles", uid), { role: "admin" });
    alert("✅ Administrador añadido");
  };

  if (loadingRole) {
    return <p style={{ textAlign: "center" }}>Cargando...</p>;
  }

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

      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <a href="https://t.me/Hispania_Imperial" target="_blank" style={{
          background: "#0088cc",
          color: "#fff",
          padding: "12px 20px",
          borderRadius: 10,
          textDecoration: "none",
          fontWeight: "bold"
        }}>
          📢 Canal Hispania Imperial
        </a>
      </div>

      {!user ? (
        <button onClick={login} style={btnPrimary}>
          Iniciar sesión
        </button>
      ) : (
        <div style={{ textAlign: "center" }}>
          <p>👤 {user.email}</p>
          <button onClick={logout} style={btnDanger}>
            Cerrar sesión
          </button>
        </div>
      )}

      {role === "admin" && (
        <div style={{ textAlign: "center", marginTop: 10 }}>
          <button onClick={makeAdmin} style={btnPrimary}>
            ➕ Añadir Administrador
          </button>
        </div>
      )}

      {(role === "admin" || role === "editor") && (
        <div style={{
          background: "#fff",
          padding: 20,
          borderRadius: 10,
          maxWidth: 600,
          margin: "30px auto",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
        }}>
          <h2 style={{ fontSize: "26px", fontWeight: "900" }}>
            ✍️ Crear artículo
          </h2>

          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título" style={{ width: "100%", marginBottom: 10, padding: 10 }} />
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Contenido" style={{ width: "100%", marginBottom: 10, padding: 10 }} />

          <select value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>

          <br /><br />

          <button onClick={publish} style={btnPrimary}>
            🚀 Publicar
          </button>
        </div>
      )}

      {/* ARTÍCULOS */}
      {CATEGORIES.map(cat => (
        <div key={cat}>
          <h2 style={{ color: "#1d4ed8" }}>📚 {cat}</h2>

          {articles.filter(a => a.category === cat).map(a => (
            <div key={a.id} style={{ background: "#fff", padding: 15, marginBottom: 15, borderRadius: 10 }}>
              <h3>{a.title}</h3>
              <p>{a.content}</p>

              {(role === "admin" || role === "editor") && (
                <>
                  <button onClick={() => startEdit(a)} style={btnPrimary}>Editar</button>
                  <button onClick={() => remove(a.id)} style={btnDanger}>Eliminar</button>
                </>
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

        {[
          { name: "Hispanopedia", url: "https://es.hispanopedia.com/wiki/Inicio" },
          { name: "Biblioteca Cervantes", url: "https://www.cervantesvirtual.com/" },
          { name: "Real Academia Española", url: "https://www.rae.es/" },
          { name: "Biblioteca Nacional de España", url: "https://www.bne.es/" },
          { name: "Real Academia de la Historia", url: "https://www.rah.es/" },
          { name: "Museo del Prado", url: "https://www.museodelprado.es/" },
          { name: "Biblioteca GHY", url: "https://bghyn.com/" }
        ].map(link => (
          <p key={link.name}>
            <a href={link.url} target="_blank" style={{
              fontWeight: "900",
              color: "#0f172a"
            }}>
              {link.name}
            </a>
          </p>
        ))}
      </div>

    </div>
  );
}