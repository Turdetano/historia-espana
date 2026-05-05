// ==============================
// 📦 IMPORTACIONES DE FIREBASE
// ==============================

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";  // ← NUEVO: Para subir imágenes

// ==============================
// ⚙️ CONFIGURACIÓN DE FIREBASE
// ==============================

const firebaseConfig = {
  apiKey: "AIzaSyAP6kTYZ4r1CYoE7aWJ_Z7YCVM_sbvIaZU",
  authDomain: "historia-espana-final.firebaseapp.com",
  projectId: "historia-espana-final",
  storageBucket: "historia-espana-final.firebasestorage.app",  // ← Ya tienes esto configurado ✅
  messagingSenderId: "62380223082",
  appId: "1:62380223082:web:b166efd842dc882cfa7813"
};

// ==============================
// 🚀 INICIALIZACIÓN
// ==============================

const app = initializeApp(firebaseConfig);

// ==============================
// 🔐 EXPORTS PARA USAR EN LA APP
// ==============================

export const db = getFirestore(app);           // 🔹 Base de datos (Firestore)
export const auth = getAuth(app);              // 🔹 Autenticación
export const provider = new GoogleAuthProvider(); // 🔹 Login con Google
export const storage = getStorage(app);        // 🔹 NUEVO: Almacenamiento de archivos ✅