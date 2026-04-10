import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAP6kTYZ4r1CYoE7aWJ_Z7YCVM_sbvIaZU",
  authDomain: "historia-espana-final.firebaseapp.com",
  projectId: "historia-espana-final",
  storageBucket: "historia-espana-final.firebasestorage.app",
  messagingSenderId: "62380223082",
  appId: "1:62380223082:web:b166efd842dc882cfa7813"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();