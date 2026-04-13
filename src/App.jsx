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

// 🔥 SUBIR IMAGEN
const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "historia_unsigned");

  const res = await fetch(
    "https://api.cloudinary.com/v1_1/dlv8e9o3/image/upload",
    { method: "POST", body: formData }
  );

  const data = await res.json();
  return data.secure_url;
};

export default function App() {
  const [articles, setArticles] = useState([]);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [image, setImage] = useState(null);

  const [editingId, setEditingId] = useState(null);

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

    let imageUrl = "";
    if (image) imageUrl = await uploadImage(image);

    const art = {
      title,
      content,
      category,
      image: imageUrl,
      date: new Date().toLocaleDateString(),
      author: user.email
    };

    const ref = await addDoc(collection(db, "articles"), art);
    setArticles([...articles, { ...art, id: ref.id }]);

    setTitle("");
    setContent("");
    setImage(null);
  };

  const startEdit = (article) => {
    setEditingId(article.id);
    setTitle(article.title);
    setContent(article.content);
    setCategory(article.category);
  };

  const saveEdit = async () => {
    if (!editingId) return;

    let imageUrl = null;
    if (image) imageUrl = await uploadImage(image);

    const updateData = {
      title,
      content,
      category
    };

    if (imageUrl) updateData.image = imageUrl;

    await updateDoc(doc(db, "articles", editingId), updateData);

    setEditingId(null);
    setTitle("");
    setContent("");
    setImage(null);

    window.location.reload();
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
    setImage(null);
  };

  const remove = async (id) => {
    await deleteDoc(doc(db, "articles", id));
    setArticles(articles.filter(a => a.id !== id));
  };

  const login = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);

  return (
    <div style={{ background:"#f8fafc", color:"#1e293b", minHeight:"100vh", padding:20 }}>
      <h1 style={{ textAlign:"center" }}>📜 Historia de España</h1>

      {!user ? (
        <button onClick={login}>Acceder con Google</button>
      ) : (
        <div style={{ textAlign:"center" }}>
          <p>{user.email}</p>
          <button onClick={logout}>Cerrar sesión</button>
        </div>
      )}

      {isEditor && (
        <div style={{ marginTop:20, background:"#fff", padding:20, borderRadius:10 }}>
          <h2>{editingId ? "Editar artículo" : "Crear artículo"}</h2>

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
            {CATEGORIES.map(c => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <input type="file" onChange={e => setImage(e.target.files[0])} />

          {!editingId ? (
            <button onClick={publish}>Publicar</button>
          ) : (
            <>
              <button onClick={saveEdit}>Guardar</button>
              <button onClick={cancelEdit}>Cancelar</button>
            </>
          )}
        </div>
      )}

      <div style={{ marginTop:30 }}>
        {articles.map(a => (
          <div key={a.id} style={{
            background:"#fff",
            padding:15,
            borderRadius:10,
            marginBottom:15
          }}>
            <h3>{a.title}</h3>

            {a.image && (
              <img
                src={a.image}
                alt=""
                style={{ width:"100%", maxHeight:300, objectFit:"cover" }}
              />
            )}

            <p>{a.content}</p>
            <small>{a.category}</small>

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
 