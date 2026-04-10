// 1. Import fungsi yang dibutuhkan
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth"; // FIX: Gabungkan import di sini
import { getFirestore } from "firebase/firestore";

// 2. Firebase configuration lo
const firebaseConfig = {
  apiKey: "AIzaSyDlnsDsJ5QSNn_NV8UclFlrweCgGE5Djjk",
  authDomain: "keuangan-6641f.firebaseapp.com",
  projectId: "keuangan-6641f",
  storageBucket: "keuangan-6641f.firebasestorage.app",
  messagingSenderId: "477908458278",
  appId: "1:477908458278:web:df4f2446224654d37abfe7",
  measurementId: "G-B4YZF8J0XG"
};

// 3. Initialize Firebase
const app = initializeApp(firebaseConfig);

// 4. Export instance untuk digunakan di Login.jsx dan App.jsx
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider(); // Sekarang ini sudah aman