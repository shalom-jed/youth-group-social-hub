import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCUq4LK1DDxHkJ6Fqj83N3rQdD2npvC44I",
  authDomain: "youth-hub-23e7b.firebaseapp.com",
  projectId: "youth-hub-23e7b",
  storageBucket: "youth-hub-23e7b.firebasestorage.app",
  messagingSenderId: "296507208968",
  appId: "1:296507208968:web:f493f6a7ad19caf9f168bd"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

