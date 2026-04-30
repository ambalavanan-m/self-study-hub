import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBVTnQGxcTM50tW-dVYBER0YHuBCNLP-Yk",
  authDomain: "study-hub-007.firebaseapp.com",
  projectId: "study-hub-007",
  storageBucket: "study-hub-007.firebasestorage.app",
  messagingSenderId: "345149702165",
  appId: "1:345149702165:web:b5502cac137580dd6c8e1c"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);