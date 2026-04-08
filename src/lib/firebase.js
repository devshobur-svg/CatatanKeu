// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDlnsDsJ5QSNn_NV8UclFlrweCgGE5Djjk",
  authDomain: "keuangan-6641f.firebaseapp.com",
  projectId: "keuangan-6641f",
  storageBucket: "keuangan-6641f.firebasestorage.app",
  messagingSenderId: "477908458278",
  appId: "1:477908458278:web:df4f2446224654d37abfe7",
  measurementId: "G-B4YZF8J0XG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);



